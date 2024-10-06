
let APP;
module.exports =class CACHE {
    constructor(_app) {
        APP = _app;
        this.cache = {};
    }

    async get(path) {
        APP.LOGGER.log(`Getting ${path} from cache}`, "debug");
        let _data = this.cache[path];
        if (_data === undefined) {
            APP.LOGGER.log(`Cache miss for ${path}`, "debug");
            _data = await APP.DB.get(path);
            this.cache[path] = _data;
        }
        else {
            APP.LOGGER.log(`Cache hit for ${path}`, "debug");
        }
        return this.cache[path];
    }

    async delete(_path) {
        if (this.cache[_path]) delete this.cache[_path];
        APP.LOGGER.log(`Removed ${_path} from cache`, "debug");
        return true;
    }

    async set(_path, _data) {
        this.cache[_path] = _data;
        APP.LOGGER.log(`Put ${_path} in cache`, "debug");
        return true;
    }
}