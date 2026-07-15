CREATE TABLE "discord_channel_settings" (
	"channel_id" text PRIMARY KEY NOT NULL,
	"settings" jsonb NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Backfill: convert each channel's filter rows into a settings document.
-- A channel is an allowlist if it has any allow rows (inert block rows are
-- dropped, matching the old engine's precedence); otherwise a blocklist.
WITH channel_mode AS (
	SELECT channel_id,
		CASE WHEN bool_or(mode = 'allow') THEN 'allowlist' ELSE 'blocklist' END AS mode
	FROM discord_watch_filters
	GROUP BY channel_id
)
INSERT INTO discord_channel_settings (channel_id, settings)
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
			'thresholds', COALESCE(
				jsonb_object_agg(f.activity_type, f.threshold) FILTER (WHERE f.threshold IS NOT NULL),
				'{}'::jsonb
			)
		)
	)
FROM discord_watch_filters f
JOIN channel_mode cm ON cm.channel_id = f.channel_id
GROUP BY f.channel_id, cm.mode;
--> statement-breakpoint
-- Channels with watches but no filter rows currently receive everything.
-- A missing settings row now means the "Light" defaults, so give these
-- channels an explicit pass-everything document to preserve behavior.
INSERT INTO discord_channel_settings (channel_id, settings)
SELECT DISTINCT w.channel_id,
	'{"version": 1, "filters": {"mode": "blocklist", "types": [], "thresholds": {}}}'::jsonb
FROM discord_watches w
ON CONFLICT (channel_id) DO NOTHING;
--> statement-breakpoint
DROP TABLE "discord_watch_filters" CASCADE;
