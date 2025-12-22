<?php
/**
 * Strona ustawień
 */

if (!defined('ABSPATH')) {
    exit;
}

// Obsługa zmiany hasła
if (isset($_POST['oc_change_password']) && wp_verify_nonce($_POST['oc_nonce'], 'oc_change_password')) {
    $new_password = $_POST['oc_new_password'] ?? '';
    $confirm_password = $_POST['oc_confirm_password'] ?? '';
    
    if (empty($new_password)) {
        $error = __('Hasło nie może być puste.', 'odwiedziny-chorych');
    } elseif ($new_password !== $confirm_password) {
        $error = __('Hasła nie są zgodne.', 'odwiedziny-chorych');
    } elseif (strlen($new_password) < 8) {
        $error = __('Hasło musi mieć co najmniej 8 znaków.', 'odwiedziny-chorych');
    } else {
        update_option('oc_admin_password_hash', password_hash($new_password, PASSWORD_DEFAULT));
        $success = __('Hasło zostało zmienione.', 'odwiedziny-chorych');
    }
}
?>

<div class="wrap">
    <h1><?php _e('Ustawienia - Odwiedziny Chorych', 'odwiedziny-chorych'); ?></h1>
    
    <?php if (!empty($error)): ?>
        <div class="notice notice-error"><p><?php echo esc_html($error); ?></p></div>
    <?php endif; ?>
    
    <?php if (!empty($success)): ?>
        <div class="notice notice-success"><p><?php echo esc_html($success); ?></p></div>
    <?php endif; ?>
    
    <form method="post" action="">
        <?php wp_nonce_field('oc_change_password', 'oc_nonce'); ?>
        
        <h2><?php _e('Zmiana hasła', 'odwiedziny-chorych'); ?></h2>
        <table class="form-table">
            <tr>
                <th scope="row">
                    <label for="oc_new_password"><?php _e('Nowe hasło', 'odwiedziny-chorych'); ?></label>
                </th>
                <td>
                    <input type="password" name="oc_new_password" id="oc_new_password" class="regular-text" required>
                </td>
            </tr>
            <tr>
                <th scope="row">
                    <label for="oc_confirm_password"><?php _e('Potwierdź hasło', 'odwiedziny-chorych'); ?></label>
                </th>
                <td>
                    <input type="password" name="oc_confirm_password" id="oc_confirm_password" class="regular-text" required>
                </td>
            </tr>
        </table>
        
        <p class="submit">
            <input type="submit" name="oc_change_password" class="button button-primary" value="<?php _e('Zmień hasło', 'odwiedziny-chorych'); ?>">
        </p>
    </form>
</div>


