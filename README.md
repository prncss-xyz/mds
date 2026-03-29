pandoc input.html \
 -f html \
 -t commonmark-raw_html \
 -s \
 --wrap=none \
 -M wrap="caca" \
 -o output.md
