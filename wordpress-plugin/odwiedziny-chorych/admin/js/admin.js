/**
 * Odwiedziny Chorych - Admin Scripts
 */

jQuery(document).ready(function($) {
    'use strict';
    
    // Obsługa eksportu na stronie import/export
    $('#oc-export-btn').on('click', function() {
        var $btn = $(this);
        $btn.prop('disabled', true).text('Eksportowanie...');
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'oc_api',
                oc_action: 'create_backup',
                nonce: ocAdminSettings ? ocAdminSettings.nonce : ''
            },
            success: function(response) {
                if (response.success) {
                    var blob = new Blob([JSON.stringify(response.data, null, 2)], {type: 'application/json'});
                    var url = URL.createObjectURL(blob);
                    var a = document.createElement('a');
                    a.href = url;
                    a.download = 'odwiedziny_chorych_backup_' + new Date().toISOString().split('T')[0] + '.json';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } else {
                    alert('Błąd eksportu: ' + (response.data ? response.data.message : 'Nieznany błąd'));
                }
            },
            error: function() {
                alert('Błąd połączenia z serwerem');
            },
            complete: function() {
                $btn.prop('disabled', false).text('Pobierz kopię zapasową');
            }
        });
    });
});



