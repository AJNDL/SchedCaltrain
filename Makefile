GTFS_FEED_URL="http://www.caltrain.com/Assets/GTFS/caltrain/GTFS-Caltrain-Devs.zip"

GTFS_FOLDER_NAME="caltrain-gtfs"

all: clean download to_json

clean:
	rm -rf caltrain-gtfs/ caltrain-gtfs.zip caltrain.json

download:
	curl $(GTFS_FEED_URL) -o $(GTFS_FOLDER_NAME).zip -s
	mkdir $(GTFS_FOLDER_NAME)
	unzip -qq $(GTFS_FOLDER_NAME).zip -d $(GTFS_FOLDER_NAME)
	rm $(GTFS_FOLDER_NAME).zip

to_json:
	./parse > caltrain.json