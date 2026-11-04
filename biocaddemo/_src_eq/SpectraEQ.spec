# -*- mode: python ; coding: utf-8 -*-
# SPECTRA EQ — full standalone one-file Windows EXE
# Build:  build_exe.bat
#
# Bundles: numpy + pygame (+SDL) + sounddevice (+PortAudio)

import sys
from pathlib import Path
from PyInstaller.utils.hooks import collect_all, collect_dynamic_libs

block_cipher = None
here = Path(SPECPATH)

datas = []
binaries = []
hiddenimports = [
    "numpy",
    "numpy.core._methods",
    "numpy.lib.format",
    "pygame",
    "pygame._sdl2",
    "pygame.gfxdraw",
    "sounddevice",
    "cffi",
    "multiprocessing",
]

# Pull entire packages so PortAudio / SDL natives ship inside the EXE
for pkg in ("pygame", "sounddevice", "numpy"):
    try:
        d, b, h = collect_all(pkg)
        datas += d
        binaries += b
        hiddenimports += h
    except Exception as exc:
        print("WARN collect_all(%s): %s" % (pkg, exc), file=sys.stderr)

try:
    binaries += collect_dynamic_libs("sounddevice")
except Exception:
    pass

a = Analysis(
    [str(here / "Eq.py")],
    pathex=[str(here)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        "tkinter",
        "matplotlib",
        "scipy",
        "PyQt5",
        "PyQt6",
        "PySide2",
        "PySide6",
        "IPython",
        "jupyter",
        "notebook",
        "pytest",
        "unittest",
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="SpectraEQ",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # UPX breaks some audio DLLs — keep off for reliability
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # windowed GUI app
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=str(here / "spectraeq.ico") if (here / "spectraeq.ico").exists() else None,
    uac_admin=False,
)
