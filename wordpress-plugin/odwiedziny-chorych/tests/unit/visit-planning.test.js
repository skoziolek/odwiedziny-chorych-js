const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const planning = require(path.resolve(__dirname, '../../assets/js/visit-planning.js'));

test('normalizeName trims whitespace and handles empty values', () => {
    assert.equal(planning.normalizeName('  Jan Kowalski  '), 'Jan Kowalski');
    assert.equal(planning.normalizeName(''), '');
    assert.equal(planning.normalizeName(null), '');
});

test('getBasePatientsForDate includes only patients scheduled for that exact date', () => {
    const patients = [
        { imieNazwisko: 'Ala', nastepnaWizyta: '2026-08-01' },
        { imieNazwisko: 'Bela', nastepnaWizyta: '2026-08-20' },
        { imieNazwisko: 'Celina', nastepnaWizyta: planning.OCCASIONAL_VISIT_MARKER },
        { imieNazwisko: 'Daria', nastepnaWizyta: '' },
        { imieNazwisko: 'Ewa', nastepnaWizyta: '2026-08-10' },
    ];

    assert.deepEqual(
        planning.getBasePatientsForDate(patients, '2026-08-10').map(p => p.imieNazwisko),
        ['Ewa']
    );
    assert.deepEqual(
        planning.getBasePatientsForDate(patients, '2026-08-20').map(p => p.imieNazwisko),
        ['Bela']
    );
    assert.deepEqual(
        planning.getBasePatientsForDate(patients, '2026-08-30').map(p => p.imieNazwisko),
        []
    );
});

test('mergePatientNamesIntoList appends missing names and avoids duplicates', () => {
    const baseList = [{ imieNazwisko: 'Adam Wielki', status: 'TAK', nastepnaWizyta: '' }];
    const index = planning.buildPatientIndexByName([
        { imieNazwisko: 'Maria Niska', status: 'TAK', nastepnaWizyta: '2026-08-02' },
    ]);

    planning.mergePatientNamesIntoList(baseList, [' Adam Wielki ', 'Maria Niska', 'Nowa Osoba'], index);

    assert.deepEqual(baseList.map(p => p.imieNazwisko), ['Adam Wielki', 'Maria Niska', 'Nowa Osoba']);
    assert.equal(baseList[2].status, 'TAK');
});

test('rebuildPastPlannedPatients reconstructs only due patients for past date', () => {
    const patients = [
        { imieNazwisko: 'Ala', nastepnaWizyta: '1999-12-31' },
        { imieNazwisko: 'Bela', nastepnaWizyta: '2000-01-10' },
        { imieNazwisko: 'Celina', nastepnaWizyta: planning.OCCASIONAL_VISIT_MARKER },
        { imieNazwisko: 'Daria', nastepnaWizyta: '' },
    ];

    const getUpcomingDutyDates = () => ['2000-01-09'];
    const result = planning.rebuildPastPlannedPatients(patients, '2000-01-02', getUpcomingDutyDates);
    assert.deepEqual(result.map(p => p.imieNazwisko), ['Ala']);
});

test('splitHistoriaEntriesByType separates visit and planned entries', () => {
    const rows = [
        { data: '2026-08-02', typ: planning.VISIT_HISTORY_TYPE, chorzy: ['Adam'] },
        { data: '2026-08-02', typ: planning.PLANNED_VISIT_HISTORY_TYPE, chorzy: ['Adam', 'Maria'] },
        { data: '2025-08-02', typ: planning.VISIT_HISTORY_TYPE, chorzy: ['Old'] },
        { data: '2026-08-09', typ: 'adwent', chorzy: ['Ignored'] },
    ];

    const result = planning.splitHistoriaEntriesByType(rows, '2026');
    assert.deepEqual(result.nextHistoriaData, { '2026-08-02': ['Adam'] });
    assert.deepEqual(result.nextPlannedData, { '2026-08-02': ['Adam', 'Maria'] });
});

test('sortPatientsByName keeps Polish alphabetical order case-insensitive', () => {
    const list = [
        { imieNazwisko: 'żaneta' },
        { imieNazwisko: 'Adam' },
        { imieNazwisko: 'Maria' },
    ];

    const sorted = planning.sortPatientsByName(list);
    assert.deepEqual(sorted.map(p => p.imieNazwisko), ['Adam', 'Maria', 'żaneta']);
});

test('getUpcomingDutyDates returns next Sundays and skips current date', () => {
    const result = planning.getUpcomingDutyDates('2026-08-02', 3);
    assert.deepEqual(result, ['2026-08-09', '2026-08-16', '2026-08-23']);
});

test('getUpcomingDutyDates includes non-Sunday holiday from callback', () => {
    const holidaySet = new Set(['2026-08-06']);
    const isHoliday = (date) => holidaySet.has(date.toISOString().slice(0, 10));
    const result = planning.getUpcomingDutyDates('2026-08-01', 3, isHoliday);
    assert.deepEqual(result, ['2026-08-02', '2026-08-06', '2026-08-09']);
});

test('createPerKeySaveQueue serializes saves and keeps latest pending payload', async () => {
    const calls = [];
    const queue = planning.createPerKeySaveQueue(async (_key, payload) => {
        calls.push([...payload]);
        await new Promise(resolve => setTimeout(resolve, 10));
        return true;
    });

    const p1 = queue.enqueue('2026-08-09', ['Ala']);
    const p2 = queue.enqueue('2026-08-09', ['Bela']);
    const p3 = queue.enqueue('2026-08-09', ['Celina']);

    const results = await Promise.all([p1, p2, p3]);
    assert.deepEqual(results, [true, true, true]);
    assert.deepEqual(calls, [['Ala'], ['Celina']]);
});

test('createPerKeySaveQueue isolates queues by key', async () => {
    const calls = [];
    const queue = planning.createPerKeySaveQueue(async (key, payload) => {
        calls.push(`${key}:${payload.join(',')}`);
        await new Promise(resolve => setTimeout(resolve, 5));
        return true;
    });

    await Promise.all([
        queue.enqueue('2026-08-09', ['Adam']),
        queue.enqueue('2026-08-16', ['Maria']),
    ]);

    assert.equal(calls.length, 2);
    assert(calls.includes('2026-08-09:Adam'));
    assert(calls.includes('2026-08-16:Maria'));
});

test('collectVisitDataFromCards extracts planned, selected and schedule map', () => {
    const makeCard = (name, checked, value) => ({
        dataset: { name },
        querySelector: (selector) => {
            if (selector === '.oc-raport-odwiedzona') return { checked };
            if (selector === '.oc-raport-next-select') return { value };
            return null;
        },
    });

    const cards = [
        makeCard(' Adam ', true, '2026-08-16'),
        makeCard('Maria', false, ''),
        makeCard('', true, '2026-08-23'),
    ];

    const result = planning.collectVisitDataFromCards(cards);
    assert.deepEqual(result.plannedChorzy, ['Adam', 'Maria']);
    assert.deepEqual(result.selectedChorzy, ['Adam']);
    assert.deepEqual(result.scheduleMap, { Adam: '2026-08-16' });
});

test('getVisitButtonState returns correct states', () => {
    const visited = planning.getVisitButtonState(['Adam']);
    assert.deepEqual(visited, {
        text: 'Odwiedzone',
        className: 'oc-btn oc-btn-small oc-btn-success',
        hasVisited: true,
    });

    const planned = planning.getVisitButtonState([]);
    assert.deepEqual(planned, {
        text: 'Zaplanowane',
        className: 'oc-btn oc-btn-small',
        hasVisited: false,
    });

    const savedEmpty = planning.getVisitButtonState([], { completed: true });
    assert.deepEqual(savedEmpty, {
        text: 'Odwiedzone',
        className: 'oc-btn oc-btn-small oc-btn-success',
        hasVisited: false,
    });
});

test('splitHistoriaEntriesByType keeps latest entry for same date/type', () => {
    const rows = [
        { data: '2026-08-02', typ: planning.VISIT_HISTORY_TYPE, chorzy: ['Adam'] },
        { data: '2026-08-02', typ: planning.VISIT_HISTORY_TYPE, chorzy: ['Maria'] },
        { data: '2026-08-02', typ: planning.PLANNED_VISIT_HISTORY_TYPE, chorzy: ['Ala'] },
        { data: '2026-08-02', typ: planning.PLANNED_VISIT_HISTORY_TYPE, chorzy: ['Bela'] },
    ];
    const result = planning.splitHistoriaEntriesByType(rows, '2026');
    assert.deepEqual(result.nextHistoriaData, { '2026-08-02': ['Maria'] });
    assert.deepEqual(result.nextPlannedData, { '2026-08-02': ['Bela'] });
});

test('formatRelativeLabel returns expected Polish labels', () => {
    const now = new Date('2026-08-01T00:00:00');
    assert.equal(planning.formatRelativeLabel('2026-08-02T00:00:00', now), 'najbliższy termin');
    assert.equal(planning.formatRelativeLabel('2026-08-08T00:00:00', now), 'za tydzień');
    assert.equal(planning.formatRelativeLabel('2026-08-15T00:00:00', now), 'za 2 tygodnie');
});

test('formatNextVisitOption handles occasional and holiday labels', () => {
    assert.equal(
        planning.formatNextVisitOption(planning.OCCASIONAL_VISIT_MARKER),
        'Okazjonalne odwiedziny (dodawane ręcznie)'
    );

    const option = planning.formatNextVisitOption('2026-08-15T00:00:00', {
        isHoliday: true,
        nowDate: new Date('2026-08-01T00:00:00'),
    });
    assert.match(option, /15\.08\.2026/);
    assert.match(option, /\(święto —/);
});

test('buildVisitHistoryPayload returns API contract payload', () => {
    const payload = planning.buildVisitHistoryPayload('2026-08-09', ['Adam', 'Maria'], planning.VISIT_HISTORY_TYPE);
    assert.deepEqual(payload, {
        action: 'dodaj_odwiedziny',
        data: '2026-08-09',
        chorzy: ['Adam', 'Maria'],
        typ: planning.VISIT_HISTORY_TYPE,
    });
});

test('persistVisitReport executes save sequence plan then visit', async () => {
    const calls = [];
    const result = await planning.persistVisitReport({
        dateStr: '2026-08-09',
        plannedChorzy: ['Adam'],
        selectedChorzy: ['Adam'],
        queuePlannedVisitSave: async (dateStr, chorzy) => {
            calls.push(['plan', dateStr, chorzy]);
            return true;
        },
        saveVisitHistoryFn: async (dateStr, chorzy, typ) => {
            calls.push(['visit', dateStr, chorzy, typ]);
            return true;
        },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(calls, [
        ['plan', '2026-08-09', ['Adam']],
        ['visit', '2026-08-09', ['Adam'], planning.VISIT_HISTORY_TYPE],
    ]);
});

test('persistVisitReport stops when planned save fails', async () => {
    const calls = [];
    const result = await planning.persistVisitReport({
        dateStr: '2026-08-09',
        plannedChorzy: ['Adam'],
        selectedChorzy: ['Adam'],
        queuePlannedVisitSave: async () => {
            calls.push('plan');
            return false;
        },
        saveVisitHistoryFn: async () => {
            calls.push('visit');
            return true;
        },
    });

    assert.deepEqual(result, { ok: false, error: 'planned_save_failed' });
    assert.deepEqual(calls, ['plan']);
});

test('persistVisitReport returns visit error when visit save fails', async () => {
    const result = await planning.persistVisitReport({
        dateStr: '2026-08-09',
        plannedChorzy: ['Adam'],
        selectedChorzy: ['Adam'],
        queuePlannedVisitSave: async () => true,
        saveVisitHistoryFn: async () => false,
    });

    assert.deepEqual(result, { ok: false, error: 'visit_save_failed' });
});

test('assembleVisitPatientList keeps later future dates empty unless scheduled or added', () => {
    const patients = [
        { imieNazwisko: 'Długajczyk Bernadeta', nastepnaWizyta: '2026-08-30' },
        { imieNazwisko: 'Harupa Daniela', nastepnaWizyta: '2026-08-16' },
        { imieNazwisko: 'Dąbrowska Helena', nastepnaWizyta: '2026-09-06' },
        { imieNazwisko: 'Okazjonalna', nastepnaWizyta: planning.OCCASIONAL_VISIT_MARKER },
    ];

    const forAug30 = planning.assembleVisitPatientList({
        aktywni: patients,
        dateStr: '2026-08-30',
        getUpcomingDutyDatesFn: planning.getUpcomingDutyDates,
    });
    assert.deepEqual(forAug30.map(p => p.imieNazwisko), ['Długajczyk Bernadeta']);

    const forSep6 = planning.assembleVisitPatientList({
        aktywni: patients,
        dateStr: '2026-09-06',
        getUpcomingDutyDatesFn: planning.getUpcomingDutyDates,
    });
    assert.deepEqual(forSep6.map(p => p.imieNazwisko), ['Dąbrowska Helena']);

    const forSep13 = planning.assembleVisitPatientList({
        aktywni: patients,
        dateStr: '2026-09-13',
        getUpcomingDutyDatesFn: planning.getUpcomingDutyDates,
    });
    assert.deepEqual(forSep13.map(p => p.imieNazwisko), []);
});

test('assembleVisitPatientList keeps occasional and previously planned names on that date', () => {
    const patients = [
        { imieNazwisko: 'Ala', nastepnaWizyta: '2026-08-30' },
        { imieNazwisko: 'Bela', nastepnaWizyta: planning.OCCASIONAL_VISIT_MARKER },
        { imieNazwisko: 'Celina', nastepnaWizyta: '2026-09-13' },
    ];

    const result = planning.assembleVisitPatientList({
        aktywni: patients,
        dateStr: '2026-09-06',
        plannedNames: ['Bela', 'Celina'],
        getUpcomingDutyDatesFn: () => ['2026-09-13'],
    });

    assert.deepEqual(result.map(p => p.imieNazwisko), ['Bela', 'Celina']);
});

test('resolveNextVisitDefault uses a later saved date or the next duty, never the report date', () => {
    const upcoming = ['2026-09-13', '2026-09-20'];

    assert.equal(
        planning.resolveNextVisitDefault('2026-09-06', upcoming, '2026-09-06'),
        '2026-09-13'
    );
    assert.equal(
        planning.resolveNextVisitDefault('2026-08-16', upcoming, '2026-09-06'),
        '2026-09-13'
    );
    assert.equal(
        planning.resolveNextVisitDefault('2026-10-04', upcoming, '2026-09-06'),
        '2026-10-04'
    );
    assert.equal(
        planning.resolveNextVisitDefault(planning.OCCASIONAL_VISIT_MARKER, upcoming, '2026-09-06'),
        planning.OCCASIONAL_VISIT_MARKER
    );
});

test('resolveScheduleAfterRemoval shifts only people scheduled for this report date', () => {
    assert.equal(
        planning.resolveScheduleAfterRemoval('2026-09-30', '2026-09-30', '2026-10-04'),
        '2026-10-04'
    );
    assert.equal(
        planning.resolveScheduleAfterRemoval(planning.OCCASIONAL_VISIT_MARKER, '2026-09-30', '2026-10-04'),
        null
    );
    assert.equal(
        planning.resolveScheduleAfterRemoval('2026-10-11', '2026-09-30', '2026-10-04'),
        null
    );
    assert.equal(
        planning.resolveScheduleAfterRemoval('2026-09-30', '2026-09-30', ''),
        planning.OCCASIONAL_VISIT_MARKER
    );
});

test('getEmptyVisitListMessage explains unplanned future dates and missing patients', () => {
    assert.equal(planning.getEmptyVisitListMessage({ hasCards: true, canAddOccasional: true }), '');
    assert.equal(
        planning.getEmptyVisitListMessage({ hasCards: false, canAddOccasional: true }),
        planning.EMPTY_VISIT_LIST_NOT_PLANNED
    );
    assert.equal(
        planning.getEmptyVisitListMessage({ hasCards: false, canAddOccasional: false }),
        planning.EMPTY_VISIT_LIST_NO_PATIENTS
    );
});
