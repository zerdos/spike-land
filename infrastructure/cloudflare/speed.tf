# Early Hints (103 responses for preloading)
resource "cloudflare_zone_setting" "early_hints" {
  zone_id    = var.zone_id
  setting_id = "early_hints"
  value      = "on"
}

# HTTP/3 (QUIC)
resource "cloudflare_zone_setting" "http3" {
  zone_id    = var.zone_id
  setting_id = "http3"
  value      = "on"
}

# Minification — HTML + CSS + JS
resource "cloudflare_zone_setting" "minify" {
  zone_id    = var.zone_id
  setting_id = "minify"
  value = {
    html = "on"
    css  = "on"
    js   = "on"
  }
}

# Brotli compression
resource "cloudflare_zone_setting" "brotli" {
  zone_id    = var.zone_id
  setting_id = "brotli"
  value      = "on"
}
