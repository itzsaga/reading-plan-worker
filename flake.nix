{
  description = "Reading plan dev environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            git
            nodejs_24
            wrangler
          ];

          shellHook = ''
            echo "Nix development environment loaded"
            echo "Git version: $(git --version)"
            echo "Node version: $(node --version)"
            echo "Wrangler CLI version: $(wrangler --version)"
          '';
        };
      });
}

