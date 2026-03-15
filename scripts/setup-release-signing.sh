#!/usr/bin/env bash
# ==============================================================================
# UNJYNX - Release Signing Setup
# ==============================================================================
# This script helps configure Android and iOS release signing for both
# local development and CI (Codemagic) environments.
#
# Usage:
#   ./scripts/setup-release-signing.sh [--ci]
#
# Options:
#   --ci    Run in CI mode (reads from environment variables, no prompts)
#
# Prerequisites:
#   - Java keytool (bundled with JDK)
#   - For iOS: Xcode + Apple Developer account
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MOBILE_DIR="$PROJECT_ROOT/apps/mobile"
ANDROID_DIR="$MOBILE_DIR/android"
KEYSTORE_DIR="$PROJECT_ROOT/.signing"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()  { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok()    { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

CI_MODE=false
if [[ "${1:-}" == "--ci" ]]; then
  CI_MODE=true
fi

# ==============================================================================
# Android Keystore Setup
# ==============================================================================
setup_android_keystore() {
  log_info "=== Android Keystore Setup ==="

  if [[ "$CI_MODE" == true ]]; then
    # -------------------------------------------------------
    # CI Mode: Decode keystore from environment variable
    # -------------------------------------------------------
    log_info "CI mode: decoding keystore from CM_KEYSTORE env var"

    if [[ -z "${CM_KEYSTORE:-}" ]]; then
      log_error "CM_KEYSTORE environment variable is not set"
      exit 1
    fi
    if [[ -z "${CM_KEYSTORE_PASSWORD:-}" ]]; then
      log_error "CM_KEYSTORE_PASSWORD environment variable is not set"
      exit 1
    fi
    if [[ -z "${CM_KEY_ALIAS:-}" ]]; then
      log_error "CM_KEY_ALIAS environment variable is not set"
      exit 1
    fi
    if [[ -z "${CM_KEY_PASSWORD:-}" ]]; then
      log_error "CM_KEY_PASSWORD environment variable is not set"
      exit 1
    fi

    KEYSTORE_PATH="$PROJECT_ROOT/keystore.jks"
    echo "$CM_KEYSTORE" | base64 --decode > "$KEYSTORE_PATH"

    cat > "$ANDROID_DIR/key.properties" <<EOF
storePassword=$CM_KEYSTORE_PASSWORD
keyPassword=$CM_KEY_PASSWORD
keyAlias=$CM_KEY_ALIAS
storeFile=$KEYSTORE_PATH
EOF

    log_ok "key.properties written to $ANDROID_DIR/key.properties"
    return
  fi

  # -------------------------------------------------------
  # Local Mode: Generate new keystore or use existing
  # -------------------------------------------------------
  mkdir -p "$KEYSTORE_DIR"

  KEYSTORE_PATH="$KEYSTORE_DIR/unjynx-release.jks"

  if [[ -f "$KEYSTORE_PATH" ]]; then
    log_warn "Keystore already exists at: $KEYSTORE_PATH"
    read -rp "Overwrite? (y/N): " OVERWRITE
    if [[ "${OVERWRITE,,}" != "y" ]]; then
      log_info "Keeping existing keystore"
    else
      rm -f "$KEYSTORE_PATH"
    fi
  fi

  if [[ ! -f "$KEYSTORE_PATH" ]]; then
    log_info "Generating new Android release keystore..."
    echo ""
    echo "You will be prompted for the following:"
    echo "  - Keystore password (remember this!)"
    echo "  - Key password (can be same as keystore password)"
    echo "  - Your name, organization, etc."
    echo ""

    read -rsp "Enter keystore password: " STORE_PASS
    echo ""
    read -rsp "Enter key password (press Enter to use same as keystore): " KEY_PASS
    echo ""
    KEY_PASS="${KEY_PASS:-$STORE_PASS}"

    read -rp "Enter key alias [unjynx-release]: " KEY_ALIAS
    KEY_ALIAS="${KEY_ALIAS:-unjynx-release}"

    keytool -genkeypair \
      -v \
      -keystore "$KEYSTORE_PATH" \
      -keyalg RSA \
      -keysize 2048 \
      -validity 10000 \
      -alias "$KEY_ALIAS" \
      -storepass "$STORE_PASS" \
      -keypass "$KEY_PASS" \
      -dname "CN=UNJYNX, OU=METAminds, O=METAminds, L=India, ST=India, C=IN"

    log_ok "Keystore generated at: $KEYSTORE_PATH"

    # Base64 encode for Codemagic upload
    KEYSTORE_B64="$KEYSTORE_DIR/unjynx-release.jks.b64"
    base64 < "$KEYSTORE_PATH" > "$KEYSTORE_B64"
    log_info "Base64-encoded keystore saved to: $KEYSTORE_B64"
    log_info "Upload the contents of this file as CM_KEYSTORE in Codemagic"
  fi

  # Write key.properties
  cat > "$ANDROID_DIR/key.properties" <<EOF
storePassword=${STORE_PASS:-REPLACE_ME}
keyPassword=${KEY_PASS:-REPLACE_ME}
keyAlias=${KEY_ALIAS:-unjynx-release}
storeFile=$KEYSTORE_PATH
EOF

  log_ok "key.properties written to $ANDROID_DIR/key.properties"

  echo ""
  log_warn "IMPORTANT: Do NOT commit key.properties or *.jks files to git!"
  log_info "They are already in .gitignore (verify below)."
}

# ==============================================================================
# Android build.gradle.kts signing config reference
# ==============================================================================
print_gradle_signing_instructions() {
  echo ""
  log_info "=== Android build.gradle.kts Signing Setup ==="
  echo ""
  echo "Add the following to apps/mobile/android/app/build.gradle.kts:"
  echo ""
  cat <<'GRADLE'
import java.io.FileInputStream
import java.util.Properties

// Load key.properties
val keystorePropertiesFile = rootProject.file("key.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

android {
    // ... existing config ...

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                keyAlias = keystoreProperties["keyAlias"] as String
                keyPassword = keystoreProperties["keyPassword"] as String
                storeFile = file(keystoreProperties["storeFile"] as String)
                storePassword = keystoreProperties["storePassword"] as String
            }
        }
    }

    buildTypes {
        release {
            signingConfig = if (keystorePropertiesFile.exists()) {
                signingConfigs.getByName("release")
            } else {
                signingConfigs.getByName("debug")
            }
        }
    }
}
GRADLE
  echo ""
}

# ==============================================================================
# iOS Signing Instructions
# ==============================================================================
print_ios_signing_instructions() {
  echo ""
  log_info "=== iOS Code Signing Setup ==="
  echo ""
  echo "For LOCAL development:"
  echo "  1. Open apps/mobile/ios/Runner.xcworkspace in Xcode"
  echo "  2. Select Runner target > Signing & Capabilities"
  echo "  3. Enable 'Automatically manage signing'"
  echo "  4. Select your Apple Developer team"
  echo "  5. Set Bundle Identifier to: com.metaminds.unjynx.unjynxMobile"
  echo ""
  echo "For CODEMAGIC CI/CD (automatic signing):"
  echo "  1. Go to App Store Connect > Users and Access > Integrations > Keys"
  echo "  2. Generate an App Store Connect API Key with 'App Manager' role"
  echo "  3. Download the .p8 key file"
  echo "  4. In Codemagic, add the 'apple_credentials' variable group:"
  echo "     - APP_STORE_CONNECT_ISSUER_ID  = Your Issuer ID"
  echo "     - APP_STORE_CONNECT_KEY_IDENTIFIER = Key ID (e.g., ABC1234DEF)"
  echo "     - APP_STORE_CONNECT_PRIVATE_KEY = Contents of the .p8 file"
  echo "     - CERTIFICATE_PRIVATE_KEY = RSA private key for code signing"
  echo ""
  echo "  5. Codemagic will automatically:"
  echo "     - Create/fetch provisioning profiles"
  echo "     - Set up the signing certificate"
  echo "     - Configure Xcode project for signing"
  echo ""
  echo "For manual signing certificate generation:"
  echo "  openssl req -nodes -newkey rsa:2048 -keyout ios_distribution.key -out ios_distribution.csr"
  echo "  # Upload .csr to Apple Developer portal to get .cer certificate"
  echo ""
}

# ==============================================================================
# Verify .gitignore entries
# ==============================================================================
verify_gitignore() {
  log_info "=== Verifying .gitignore ==="

  local GITIGNORE="$PROJECT_ROOT/.gitignore"
  local MISSING_ENTRIES=()

  local REQUIRED_PATTERNS=(
    "key.properties"
    "*.jks"
    "*.keystore"
    ".signing/"
    "*.p8"
    "*.p12"
    "*.mobileprovision"
  )

  for pattern in "${REQUIRED_PATTERNS[@]}"; do
    if ! grep -qF "$pattern" "$GITIGNORE" 2>/dev/null; then
      MISSING_ENTRIES+=("$pattern")
    fi
  done

  if [[ ${#MISSING_ENTRIES[@]} -gt 0 ]]; then
    log_warn "The following patterns are NOT in .gitignore:"
    for entry in "${MISSING_ENTRIES[@]}"; do
      echo "  - $entry"
    done
    echo ""
    read -rp "Add them now? (Y/n): " ADD_ENTRIES
    if [[ "${ADD_ENTRIES,,}" != "n" ]]; then
      echo "" >> "$GITIGNORE"
      echo "# --- Release Signing ---" >> "$GITIGNORE"
      for entry in "${MISSING_ENTRIES[@]}"; do
        echo "$entry" >> "$GITIGNORE"
      done
      log_ok "Added missing patterns to .gitignore"
    fi
  else
    log_ok "All signing-related patterns are in .gitignore"
  fi
}

# ==============================================================================
# Codemagic environment setup summary
# ==============================================================================
print_codemagic_setup() {
  echo ""
  log_info "=== Codemagic Environment Variable Groups ==="
  echo ""
  echo "Create the following groups in Codemagic UI (Settings > Environment variables):"
  echo ""
  echo "Group: android_credentials"
  echo "  CM_KEYSTORE          = <base64-encoded .jks file>"
  echo "  CM_KEYSTORE_PASSWORD = <keystore password>"
  echo "  CM_KEY_ALIAS         = <key alias (e.g., unjynx-release)>"
  echo "  CM_KEY_PASSWORD      = <key password>"
  echo ""
  echo "Group: apple_credentials"
  echo "  APP_STORE_CONNECT_ISSUER_ID      = <issuer ID from ASC>"
  echo "  APP_STORE_CONNECT_KEY_IDENTIFIER = <key ID from ASC>"
  echo "  APP_STORE_CONNECT_PRIVATE_KEY    = <.p8 key contents>"
  echo "  CERTIFICATE_PRIVATE_KEY          = <RSA private key for signing>"
  echo ""
  echo "Group: slack_credentials"
  echo "  SLACK_WEBHOOK_URL = <Slack incoming webhook URL>"
  echo ""
  echo "Group: shorebird_credentials"
  echo "  SHOREBIRD_TOKEN = <from shorebird login --ci>"
  echo ""
  echo "Optional (for Google Play publishing):"
  echo "  GCLOUD_SERVICE_ACCOUNT_CREDENTIALS = <JSON service account key>"
  echo ""
}

# ==============================================================================
# Main
# ==============================================================================
main() {
  echo ""
  echo "========================================"
  echo "  UNJYNX Release Signing Setup"
  echo "========================================"
  echo ""

  setup_android_keystore

  if [[ "$CI_MODE" == false ]]; then
    print_gradle_signing_instructions
    print_ios_signing_instructions
    verify_gitignore
    print_codemagic_setup
  fi

  echo ""
  log_ok "Release signing setup complete!"
  echo ""
}

main "$@"
