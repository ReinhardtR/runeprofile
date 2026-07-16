CREATE TABLE "discord_channel_settings" (
	"channel_id" text PRIMARY KEY NOT NULL,
	"settings" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Backfill: convert each channel's filter rows into a settings document.
--
-- - A channel is an allowlist if it has any allow rows (inert block rows are
--   dropped, matching the old engine's precedence); otherwise a blocklist.
-- - Default thresholds (level_up 50, quest_completed Experienced) fill the
--   gaps; the channel's own thresholds win where set. quest_completed is the
--   exception: old values were quest points, which are meaningless on the new
--   difficulty scale, so they're replaced by the default.
-- - Documents identical to the defaults are skipped: a missing settings row
--   means "use the defaults", and those channels keep tracking future default
--   changes. Channels with watches but no filter rows get no row for the same
--   reason (per product decision they move from pass-everything to defaults).
WITH channel_mode AS (
	SELECT channel_id,
		CASE WHEN bool_or(mode = 'allow') THEN 'allowlist' ELSE 'blocklist' END AS mode
	FROM discord_watch_filters
	GROUP BY channel_id
),
docs AS (
	SELECT f.channel_id,
		jsonb_build_object(
			'version', 1,
			'filters', jsonb_build_object(
				'mode', cm.mode,
				'types', COALESCE(
					jsonb_agg(f.activity_type) FILTER (
						WHERE f.mode = CASE WHEN cm.mode = 'allowlist' THEN 'allow' ELSE 'block' END
					),
					'[]'::jsonb
				),
				'thresholds',
					'{"level_up": 50, "quest_completed": 2}'::jsonb || (
						COALESCE(
							jsonb_object_agg(f.activity_type, f.threshold) FILTER (WHERE f.threshold IS NOT NULL),
							'{}'::jsonb
						) - 'quest_completed'
					)
			)
		) AS settings
	FROM discord_watch_filters f
	JOIN channel_mode cm ON cm.channel_id = f.channel_id
	GROUP BY f.channel_id, cm.mode
)
INSERT INTO discord_channel_settings (channel_id, settings)
SELECT channel_id, settings
FROM docs
WHERE settings <> '{"version": 1, "filters": {"mode": "blocklist", "types": [], "thresholds": {"level_up": 50, "quest_completed": 2}}}'::jsonb;
--> statement-breakpoint
DROP TABLE "discord_watch_filters" CASCADE;
