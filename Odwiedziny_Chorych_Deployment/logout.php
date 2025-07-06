<?php
session_start();

// Usuń wszystkie zmienne sesji
$_SESSION = array();

// Zniszcz cookie sesji
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Ostatecznie, zniszcz sesję
session_destroy();

// Przekieruj na stronę logowania
header('Location: login.php');
exit;
?> 