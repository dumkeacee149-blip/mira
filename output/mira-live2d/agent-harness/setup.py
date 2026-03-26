from setuptools import find_namespace_packages, setup


setup(
    name="cli-anything-mira-live2d",
    version="0.1.0",
    description="CLI-Anything style workflow harness for the Mira Live2D avatar pipeline",
    packages=find_namespace_packages(include=["cli_anything.*"]),
    include_package_data=True,
    install_requires=[
        "click>=8.1.7",
        "pyjab>=1.1.7",
    ],
    entry_points={
        "console_scripts": [
            "cli-anything-mira-live2d=cli_anything.mira_live2d.__main__:main",
        ],
    },
)
