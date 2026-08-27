(function(root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
        return;
    }
    root.ocVisitPlanning = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    'use strict';

    const OCCASIONAL_VISIT_MARKER = '9999-12-31';
    const VISIT_HISTORY_TYPE = 'niedziela';
    const PLANNED_VISIT_HISTORY_TYPE = 'plan_niedziela';
    const NAME_SORT_LOCALE = 'pl';
    const NAME_SORT_OPTIONS = { sensitivity: 'base' };

    function normalizeName(value) {
        return String(value || '').trim();
    }

    function compareNames(a, b) {
        return normalizeName(a).localeCompare(normalizeName(b), NAME_SORT_LOCALE, NAME_SORT_OPTIONS);
    }

    function sortPatientsByName(list) {
        return [...list].sort((a, b) => compareNames(a.imieNazwisko, b.imieNazwisko));
    }

    function createPatientFallback(name) {
        return {
            imieNazwisko: name,
            status: 'TAK',
            nastepnaWizyta: '',
        };
    }

    function buildPatientIndexByName(list) {
        const byName = new Map();
        list.forEach(patient => {
            const name = normalizeName(patient.imieNazwisko);
            if (name && !byName.has(name)) {
                byName.set(name, patient);
            }
        });
        return byName;
    }

    function includesPatientByName(list, name) {
        const normalized = normalizeName(name);
        return list.some(patient => normalizeName(patient.imieNazwisko) === normalized);
    }

    function mergePatientNamesIntoList(baseList, names, patientByName) {
        names.forEach(rawName => {
            const name = normalizeName(rawName);
            if (!name || includesPatientByName(baseList, name)) {
                return;
            }
            baseList.push(patientByName.get(name) || createPatientFallback(name));
        });
    }

    function isOccasionalVisit(dateStr) {
        return dateStr === OCCASIONAL_VISIT_MARKER;
    }

    function isExtraPatientOnDate(scheduledDate, dateStr) {
        if (!scheduledDate || isOccasionalVisit(scheduledDate)) return true;
        return scheduledDate !== dateStr;
    }

    function isPastDate(dateStr, nowDate) {
        const selectedDate = new Date(dateStr);
        selectedDate.setHours(0, 0, 0, 0);
        const today = nowDate ? new Date(nowDate) : new Date();
        today.setHours(0, 0, 0, 0);
        return selectedDate < today;
    }

    function getBasePatientsForDate(aktywni, dateStr) {
        return aktywni.filter(patient => {
            const sched = patient.nastepnaWizyta;
            if (!sched || isOccasionalVisit(sched)) return false;
            return sched === dateStr;
        });
    }

    function assembleVisitPatientList({
        aktywni,
        dateStr,
        visitedNames = [],
        plannedNames = [],
        patientByName,
        getUpcomingDutyDatesFn,
    }) {
        const list = getBasePatientsForDate(aktywni, dateStr);
        const index = patientByName || buildPatientIndexByName(aktywni);
        mergePatientNamesIntoList(list, visitedNames || [], index);
        mergePatientNamesIntoList(list, plannedNames || [], index);

        if (list.length === 0 && (!visitedNames || visitedNames.length === 0)) {
            return sortPatientsByName(
                rebuildPastPlannedPatients(aktywni, dateStr, getUpcomingDutyDatesFn)
            );
        }

        return sortPatientsByName(list);
    }

    function resolveNextVisitDefault(scheduledDate, upcomingDates, reportDateStr) {
        if (isOccasionalVisit(scheduledDate)) {
            return OCCASIONAL_VISIT_MARKER;
        }
        if (scheduledDate && reportDateStr && scheduledDate > reportDateStr) {
            return scheduledDate;
        }
        return (upcomingDates && upcomingDates[0]) || '';
    }

    function resolveScheduleAfterRemoval(scheduledDate, reportDateStr, nextDutyDate) {
        if (!scheduledDate || isOccasionalVisit(scheduledDate)) return null;
        if (scheduledDate !== reportDateStr) return null;
        return nextDutyDate || OCCASIONAL_VISIT_MARKER;
    }

    function rebuildPastPlannedPatients(aktywni, dateStr, getUpcomingDutyDates) {
        if (!isPastDate(dateStr)) {
            return [];
        }
        const nextDuty = getUpcomingDutyDates(dateStr, 1)[0] || '';
        if (!nextDuty) {
            return [];
        }
        return aktywni.filter(patient => {
            const sched = patient.nastepnaWizyta;
            if (!sched || isOccasionalVisit(sched)) return false;
            return sched <= nextDuty;
        });
    }

    function splitHistoriaEntriesByType(allHistoria, year) {
        const nextHistoriaData = {};
        const nextPlannedData = {};

        allHistoria.forEach(entry => {
            if (!entry.data || !entry.data.startsWith(year)) return;
            if (entry.typ === VISIT_HISTORY_TYPE) {
                nextHistoriaData[entry.data] = entry.chorzy || [];
            }
            if (entry.typ === PLANNED_VISIT_HISTORY_TYPE) {
                nextPlannedData[entry.data] = entry.chorzy || [];
            }
        });

        return { nextHistoriaData, nextPlannedData };
    }

    function formatDateForApiDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getUpcomingDutyDates(dateStr, count = 5, isHolidayFn = () => false) {
        const result = [];
        const start = new Date(dateStr);
        start.setDate(start.getDate() + 1);
        const limit = new Date(start);
        limit.setDate(limit.getDate() + 400);

        for (let d = new Date(start); d <= limit && result.length < count; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || isHolidayFn(d)) {
                result.push(formatDateForApiDate(d));
            }
        }

        return result;
    }

    function createPerKeySaveQueue(saveFn) {
        const stateByKey = {};

        function enqueue(key, payload) {
            if (!key) return Promise.resolve(false);
            const state = stateByKey[key] || { inFlight: false, pending: null, waiters: [] };
            stateByKey[key] = state;
            state.pending = Array.isArray(payload) ? [...payload] : [];

            return new Promise(resolve => {
                state.waiters.push(resolve);
                if (!state.inFlight) {
                    void flush(key);
                }
            });
        }

        async function flush(key) {
            const state = stateByKey[key];
            if (!state) return;

            state.inFlight = true;
            let lastOk = true;

            try {
                while (state.pending !== null) {
                    const nextPayload = state.pending;
                    state.pending = null;
                    lastOk = await saveFn(key, nextPayload);
                }
            } finally {
                state.inFlight = false;
                const waiters = state.waiters.splice(0);
                waiters.forEach(resolve => resolve(lastOk));

                if (state.pending !== null && !state.inFlight) {
                    void flush(key);
                }
            }
        }

        return { enqueue };
    }

    function collectVisitDataFromCards(cards) {
        const selectedChorzy = [];
        const plannedChorzy = [];
        const scheduleMap = {};

        cards.forEach(card => {
            const name = normalizeName(card.dataset && card.dataset.name);
            if (!name) return;

            plannedChorzy.push(name);
            const checkbox = card.querySelector('.oc-raport-odwiedzona');
            const select = card.querySelector('.oc-raport-next-select');
            if (checkbox && checkbox.checked) {
                selectedChorzy.push(name);
            }
            if (select && select.value) {
                scheduleMap[name] = select.value;
            }
        });

        return { selectedChorzy, plannedChorzy, scheduleMap };
    }

    function getVisitButtonState(selectedChorzy, options = {}) {
        const hasVisited = Array.isArray(selectedChorzy) && selectedChorzy.length > 0;
        const completed = options.completed === true || hasVisited;
        return completed
            ? { text: 'Odwiedzone', className: 'oc-btn oc-btn-small oc-btn-success', hasVisited }
            : { text: 'Zaplanowane', className: 'oc-btn oc-btn-small', hasVisited: false };
    }

    function buildVisitHistoryPayload(dateStr, chorzyList, typ) {
        return {
            action: 'dodaj_odwiedziny',
            data: dateStr,
            chorzy: Array.isArray(chorzyList) ? chorzyList : [],
            typ,
        };
    }

    async function persistVisitReport({
        dateStr,
        plannedChorzy,
        selectedChorzy,
        queuePlannedVisitSave,
        saveVisitHistoryFn,
    }) {
        if (!dateStr) {
            return { ok: false, error: 'invalid_date' };
        }

        const planOk = await queuePlannedVisitSave(dateStr, plannedChorzy || []);
        if (!planOk) {
            return { ok: false, error: 'planned_save_failed' };
        }

        const visitOk = await saveVisitHistoryFn(dateStr, selectedChorzy || [], VISIT_HISTORY_TYPE);
        if (!visitOk) {
            return { ok: false, error: 'visit_save_failed' };
        }

        return { ok: true };
    }

    const EMPTY_VISIT_LIST_NO_PATIENTS = 'Brak aktywnych chorych do wyświetlenia.';
    const EMPTY_VISIT_LIST_NOT_PLANNED = 'Nikt nie jest jeszcze zaplanowany na ten dzień. Dodaj osobę okazjonalnie albo wybierz ten termin jako „następną wizytę” w raporcie wcześniejszego dnia.';
    const VISIT_LIST_HINT = 'Zaznacz, kto został odwiedzony, i wybierz termin kolejnej wizyty. Osobę, której nie będzie, możesz usunąć z listy.';

    function getEmptyVisitListMessage({ hasCards, canAddOccasional }) {
        if (hasCards) return '';
        if (canAddOccasional) return EMPTY_VISIT_LIST_NOT_PLANNED;
        return EMPTY_VISIT_LIST_NO_PATIENTS;
    }

    function ocPlural(n, one, few, many) {
        if (n === 1) return one;
        const mod10 = n % 10;
        const mod100 = n % 100;
        if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
        return many;
    }

    function formatDisplayDate(dateInput) {
        const d = new Date(dateInput);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    }

    function formatRelativeLabel(dateStr, nowDate = new Date()) {
        const target = new Date(dateStr);
        target.setHours(0, 0, 0, 0);
        const today = new Date(nowDate);
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target - today) / 86400000);

        if (diffDays <= 3) return 'najbliższy termin';
        const weeks = Math.round(diffDays / 7);
        if (weeks === 1) return 'za tydzień';
        if (weeks < 5) return `za ${weeks} ${ocPlural(weeks, 'tydzień', 'tygodnie', 'tygodni')}`;
        const months = Math.round(diffDays / 30);
        if (months <= 1) return 'za miesiąc';
        return `za ${months} ${ocPlural(months, 'miesiąc', 'miesiące', 'miesięcy')}`;
    }

    function formatNextVisitOption(dateStr, options = {}) {
        if (isOccasionalVisit(dateStr)) {
            return 'Okazjonalne odwiedziny (dodawane ręcznie)';
        }
        const date = new Date(dateStr);
        const locale = options.locale || 'pl-PL';
        const weekday = date.toLocaleDateString(locale, { weekday: 'long' });
        const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1);
        const dateFmt = formatDisplayDate(date);
        const rel = formatRelativeLabel(dateStr, options.nowDate || new Date());
        const swietoPrefix = options.isHoliday ? 'święto — ' : '';
        return `${weekdayCap}, ${dateFmt} (${swietoPrefix}${rel})`;
    }

    return {
        OCCASIONAL_VISIT_MARKER,
        VISIT_HISTORY_TYPE,
        PLANNED_VISIT_HISTORY_TYPE,
        NAME_SORT_LOCALE,
        NAME_SORT_OPTIONS,
        normalizeName,
        compareNames,
        sortPatientsByName,
        createPatientFallback,
        buildPatientIndexByName,
        includesPatientByName,
        mergePatientNamesIntoList,
        isOccasionalVisit,
        isExtraPatientOnDate,
        isPastDate,
        getBasePatientsForDate,
        assembleVisitPatientList,
        resolveNextVisitDefault,
        resolveScheduleAfterRemoval,
        rebuildPastPlannedPatients,
        splitHistoriaEntriesByType,
        getUpcomingDutyDates,
        createPerKeySaveQueue,
        collectVisitDataFromCards,
        getVisitButtonState,
        ocPlural,
        formatRelativeLabel,
        formatNextVisitOption,
        buildVisitHistoryPayload,
        persistVisitReport,
        EMPTY_VISIT_LIST_NO_PATIENTS,
        EMPTY_VISIT_LIST_NOT_PLANNED,
        VISIT_LIST_HINT,
        getEmptyVisitListMessage,
    };
}));
