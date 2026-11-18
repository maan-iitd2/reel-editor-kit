"""Time parsing and formatting. Three formats, one direction each."""


def parse_time(s: str) -> float:
    """'00:03.2' or '3.2' or '1:02:03.5' -> seconds."""
    total = 0.0
    for part in str(s).strip().split(":"):
        total = total * 60 + float(part)
    return total


def fmt_time(t: float) -> str:
    """Seconds -> 'MM:SS.s', the shot plan's human format."""
    m, s = divmod(float(t), 60)
    return f"{int(m):02d}:{s:04.1f}"


def ass_time(t: float) -> str:
    """Seconds -> 'H:MM:SS.cc', the only format ASS accepts."""
    h, rem = divmod(float(t), 3600)
    m, s = divmod(rem, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def _selfcheck() -> None:
    assert parse_time("3.2") == 3.2
    assert parse_time("00:03.2") == 3.2
    assert parse_time("1:02:03.5") == 3723.5
    assert fmt_time(3.2) == "00:03.2"
    assert fmt_time(72.55) == "01:12.5"
    assert ass_time(3.2) == "0:00:03.20"
    assert ass_time(3723.5) == "1:02:03.50"
    # Round-trip through the human format keeps 0.1s precision.
    assert abs(parse_time(fmt_time(12.34)) - 12.3) < 1e-9
    print("timefmt selfcheck OK")


if __name__ == "__main__":
    _selfcheck()
