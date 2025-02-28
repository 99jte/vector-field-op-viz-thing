#!/usr/bin/fish
while true
	inotifywait *.ts
	nice -n 10 tsc main.ts
end
