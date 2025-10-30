package main

// StreamReload reload stream
func (obj *StorageST) StopAll() {
	obj.mutex.RLock()
	defer obj.mutex.RUnlock()
	for _, st := range obj.Streams {
		for _, i2 := range st.Channels {
			if i2.runLock {
				i2.signals <- SignalStreamStop
			}
		}
	}
}
