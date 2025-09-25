-- EV_FILTER_FIX.sql
-- This file documents the EV filtering fix applied to the VR-Odds platform
-- It can be used to track the fix in the database

-- Create a record of the fix in the version_history table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'version_history') THEN
        INSERT INTO version_history (
            version,
            description,
            applied_at,
            applied_by,
            component
        ) VALUES (
            '2.80',
            'Fixed EV filtering to respect user-selected sportsbooks',
            NOW(),
            'system',
            'frontend'
        );
    END IF;
END $$;

-- Create a record in the feature_flags table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_flags') THEN
        INSERT INTO feature_flags (
            name,
            enabled,
            description,
            created_at,
            updated_at
        ) VALUES (
            'ev_filtering_by_selected_books',
            TRUE,
            'EV calculations are based only on user-selected sportsbooks',
            NOW(),
            NOW()
        )
        ON CONFLICT (name) DO UPDATE
        SET 
            enabled = TRUE,
            description = 'EV calculations are based only on user-selected sportsbooks',
            updated_at = NOW();
    END IF;
END $$;

-- Log the fix in the system_logs table (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_logs') THEN
        INSERT INTO system_logs (
            log_level,
            component,
            message,
            details,
            created_at
        ) VALUES (
            'INFO',
            'frontend',
            'Applied EV filtering fix',
            'Modified OddsTable.js to filter EV calculations based on user-selected sportsbooks',
            NOW()
        );
    END IF;
END $$;

-- Output success message
SELECT 'EV filtering fix has been documented in the database.' AS status;
