{
  description = "Dev env for this repo with Node.js 24.6.0 from nixpkgs";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { self, nixpkgs }:
    let
      systems = [
        "x86_64-darwin"
        "aarch64-darwin"
        "x86_64-linux"
        "aarch64-linux"
      ];
      forAllSystems =
        f:
        nixpkgs.lib.genAttrs systems (
          system:
          let
            pkgs = import nixpkgs { inherit system; };
          in
          f system pkgs
        );
    in
    {
      devShells = forAllSystems (
        _system: pkgs: {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_24
            ];

          };
        }
      );
    };
}
