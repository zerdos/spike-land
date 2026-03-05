output "zone_name" {
  description = "spike.land zone name"
  value       = data.cloudflare_zone.spike_land.name
}

output "waf_managed_ruleset_id" {
  description = "ID of the consolidated managed WAF ruleset (CF Managed + OWASP)"
  value       = cloudflare_ruleset.managed_waf.id
}

output "rate_limit_ruleset_id" {
  description = "ID of the rate limiting ruleset"
  value       = cloudflare_ruleset.rate_limiting.id
}

output "cache_ruleset_id" {
  description = "ID of the cache rules ruleset"
  value       = cloudflare_ruleset.cache_rules.id
}
