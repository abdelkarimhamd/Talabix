# MySQL Backup Restore Drill

This drill verifies that Talabix database backups can be restored into a disposable database. Run it before launch, after backup configuration changes, and at least once per quarter.

## Preconditions

- Run this in staging or in an isolated maintenance VM, never against the production database.
- Confirm the target environment has the same application build and migrations as the backup source.
- Confirm `BACKUP_DISKS`, `BACKUP_ARCHIVE_PASSWORD`, database credentials, and object storage credentials are configured.
- Create a disposable database name such as `talabix_restore_YYYYMMDD`.

## Daily Automation

The scheduler runs these commands:

| Time  | Command                | Purpose                                       |
| ----- | ---------------------- | --------------------------------------------- |
| 01:00 | `backup:clean`         | Apply the configured backup retention policy  |
| 01:30 | `backup:run --only-db` | Create a verified MySQL database backup       |
| 10:00 | `backup:monitor`       | Alert when backup age or storage is unhealthy |

`BACKUP_VERIFY_ARCHIVE=true` must remain enabled so each backup archive is opened and checked after creation.

## Evidence Location

Record the staging restore result in [launch-evidence.md](./launch-evidence.md). Do not paste backup passwords, object-storage keys, DSNs, customer data, or full dump contents into the repo.

## Restore Procedure

1. List backups and identify the latest backup on the expected disk:

   ```bash
   php artisan backup:list
   ```

2. Download or copy the selected backup archive from the backup disk to the maintenance VM.

3. Extract the archive using the configured `BACKUP_ARCHIVE_PASSWORD` when encryption is enabled.

4. Create the disposable restore database:

   ```bash
   mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p -e "CREATE DATABASE talabix_restore_YYYYMMDD CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
   ```

5. Import the SQL dump into the disposable database:

   ```bash
   mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p talabix_restore_YYYYMMDD < database.sql
   ```

6. Point a temporary API environment at the disposable database and run:

   ```bash
   php artisan migrate:status
   php artisan db:show --database=mysql
   php artisan test tests/Feature/Ops/ReadinessTest.php
   ```

7. Record restore evidence in the launch or quarterly ops note:

   | Field                    | Value |
   | ------------------------ | ----- |
   | Drill date               |       |
   | Environment              |       |
   | Backup disk              |       |
   | Backup archive timestamp |       |
   | Backup archive size      |       |
   | Backup archive checksum  |       |
   | Restore database         |       |
   | Extract result           |       |
   | Import result            |       |
   | Migration status result  |       |
   | Readiness test result    |       |
   | Cleanup verification     |       |
   | Operator                 |       |

8. Drop the disposable restore database after evidence is recorded:

   ```bash
   mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USERNAME" -p -e "DROP DATABASE talabix_restore_YYYYMMDD;"
   ```

## Acceptance Criteria

- The backup archive extracts successfully.
- The SQL dump imports into the disposable database without errors.
- `migrate:status` shows the application schema is present.
- The readiness test passes against the temporary restored database.
- The evidence table is completed and linked from the release or quarterly ops note.
