# Host-specific bash augmentations for dot-sync.
#
# Copy this file to:
#   .local/bashrc.$(hostname -s).sh
# Then edit values for that machine and commit the new file.

pathappend "/opt/homebrew/opt/libpq/bin"

export LDFLAGS="-L/opt/homebrew/opt/openssl@3/lib -L/opt/homebrew/opt/libpq/lib ${LDFLAGS:-}"
export CPPFLAGS="-I/opt/homebrew/opt/openssl@3/include -I/opt/homebrew/opt/libpq/include ${CPPFLAGS:-}"
export PKG_CONFIG_PATH="/opt/homebrew/opt/openssl@3/lib/pkgconfig:/opt/homebrew/opt/libpq/lib/pkgconfig${PKG_CONFIG_PATH:+:$PKG_CONFIG_PATH}"
