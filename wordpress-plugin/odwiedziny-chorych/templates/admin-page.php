<?php
/**
 * Strona administratora
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap">
    <h1><?php _e('Odwiedziny Chorych', 'odwiedziny-chorych'); ?></h1>
    
    <div class="oc-admin-info">
        <h2><?php _e('Informacje', 'odwiedziny-chorych'); ?></h2>
        <p><?php _e('Aby wyświetlić aplikację na stronie, użyj shortcode:', 'odwiedziny-chorych'); ?></p>
        <code>[odwiedziny_chorych]</code>
        
        <h3><?php _e('Statystyki', 'odwiedziny-chorych'); ?></h3>
        <?php
        global $wpdb;
        $table_chorzy = OC_Database::get_table_name('chorzy');
        $table_szafarze = OC_Database::get_table_name('szafarze');
        
        $liczba_chorych = $wpdb->get_var("SELECT COUNT(*) FROM $table_chorzy");
        $liczba_szafarzy = $wpdb->get_var("SELECT COUNT(*) FROM $table_szafarze WHERE aktywny = 1");
        ?>
        <ul>
            <li><?php printf(__('Liczba chorych: %d', 'odwiedziny-chorych'), $liczba_chorych); ?></li>
            <li><?php printf(__('Liczba szafarzy: %d', 'odwiedziny-chorych'), $liczba_szafarzy); ?></li>
        </ul>
    </div>
</div>


