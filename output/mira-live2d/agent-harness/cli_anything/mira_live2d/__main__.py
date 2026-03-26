from .mira_live2d_cli import cli


def main() -> None:
    cli.main(standalone_mode=True)


if __name__ == "__main__":
    main()
