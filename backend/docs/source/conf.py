# Configuration file for the Sphinx documentation builder.
#

import os
import sys

sys.path.insert(0, os.path.abspath("../.."))  # Adjust path as needed

# For the full list of built-in configuration values, see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Project information -----------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#project-information

project = "Wildlife Tracker API"
copyright = "2025, Steven Liu"
author = "Steven Liu"
release = "0.1.0"

# -- General configuration ---------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#general-configuration

extensions = []

templates_path = ["_templates"]
exclude_patterns = []

language = "Python"

# -- Options for HTML output -------------------------------------------------
# https://www.sphinx-doc.org/en/master/usage/configuration.html#options-for-html-output

# html_theme = 'alabaster'
html_theme = "sphinx_rtd_theme"

html_static_path = ["_static"]

extensions = [
    "sphinx.ext.autodoc",  # Pulls in your Python docstrings
    "sphinx.ext.napoleon",  # Supports Google-style docstrings
    "sphinx.ext.viewcode",  # Adds "view source" links
]
