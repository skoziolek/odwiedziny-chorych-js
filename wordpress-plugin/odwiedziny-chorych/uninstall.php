<?php
/**
 * Odinstalowanie pluginu
 */

// Zabezpieczenie - sprawdź czy to WordPress wywołuje
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Załaduj klasę bazy danych
require_once plugin_dir_path(__FILE__) . 'includes/class-database.php';

// Usuń tabele
OC_Database::drop_tables();

// Usuń opcje
delete_option('oc_db_version');
delete_option('oc_admin_password_hash');
delete_option('oc_encryption_key');
