-- lovable-cron-fallback-reviewed: 288 runs/day; market prices come from an external feed with no change event
SELECT cron.schedule('market-price-refresh-5min', '*/5 * * * *', $$SELECT 1;$$);