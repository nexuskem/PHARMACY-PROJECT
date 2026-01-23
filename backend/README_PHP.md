# MediCare Pharmacy PHP Backend

This backend has been migrated from Node.js to pure PHP. It interacts with the same MySQL database.

## Prerequisites
- PHP 7.4 or higher
- PHP MySQL Extension (`php-mysql`)
- MySQL Database running

## Setup

1.  **Database Config**:
    Ensure `backend/config/db.php` has the correct credentials.
    Default:
    - Host: localhost
    - User: root
    - Password: (empty)
    - DB: medicare_pharmacy

2.  **Run the Server**:
    The backend uses the PHP built-in server with a router script to handle API requests.

    Run the following command from the project root:
    ```bash
    php -S localhost:3000 -t backend/ backend/router.php
    ```

3.  **Frontend**:
    The frontend should point to `http://localhost:3000/api/...`. No changes should be needed if it was already pointing to port 3000.

## API Structure
- Entry Point: `backend/router.php`
- Configuration: `backend/config/db.php`
- API Logic: `backend/api/*.php`
- Utils: `backend/utils/jwt.php`

## Notes
- `node_modules` and `package.json` in the backend folder are no longer needed for the runtime but kept for reference or if you need to run migration scripts that haven't been ported (though `database.js` was mainly for init).
- The PHP `db.php` does NOT auto-create tables like the Node.js one did. Make sure the database exists. If safe, you can run the Node.js backend ONCE to init the DB, or import `database.sql`.
