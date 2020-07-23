# updates


## jackd

```
sudo systemctl disable ameize-jack-daemon.service
```

=> seems to work properly with Alsa... to be confirmed



## bin

- `transpileThing()` for quicker startup

=> multiple restart problem, update `bin/runner`

added a debounce to the watch, because on first update all file are triggerred as updated, 
- so need a new deps

```sh
# to avoid reinstalling the whole app
rm -f package-lock.json
npm install --save-dev lodash.debounce
```
