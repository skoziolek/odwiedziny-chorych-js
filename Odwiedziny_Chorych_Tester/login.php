<?php
session_start();

// Przekieruj do aplikacji, jeśli użytkownik jest już zalogowany
if (isset($_SESSION['loggedin']) && $_SESSION['loggedin'] === true) {
    header('Location: main.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Logowanie - Odwiedziny Chorych</title>
    <link rel="stylesheet" href="style.css">
    <style>
        body, html {
            height: 100%;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #f0f2f5;
            font-family: Arial, sans-serif;
        }
        .login-container {
            padding: 2.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            text-align: center;
            width: 100%;
            max-width: 350px;
        }
        .login-container h1 {
            margin-bottom: 1.5rem;
            color: #333;
        }
        .login-container input[type="password"] {
            width: calc(100% - 1.6rem);
            padding: 0.8rem;
            margin-bottom: 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 1rem;
        }
        .login-container button {
            width: 100%;
            padding: 0.8rem;
            border: none;
            background-color: #007bff;
            color: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1rem;
            transition: background-color 0.2s;
        }
        .login-container button:hover {
            background-color: #0056b3;
        }
        .error-message {
            color: #d93025;
            margin-bottom: 1rem;
            text-align: left;
            padding: 0.5rem;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>System Ewidencji Odwiedzin</h1>
        <?php
            if (isset($_SESSION['login_error'])) {
                echo '<p class="error-message">' . htmlspecialchars($_SESSION['login_error']) . '</p>';
                unset($_SESSION['login_error']);
            }
        ?>
        <form action="auth.php" method="post">
            <input type="password" name="password" placeholder="Hasło" required>
            <button type="submit">Zaloguj</button>
        </form>
    </div>
</body>
</html> 