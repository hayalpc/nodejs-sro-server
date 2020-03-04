import dateFormat from 'dateformat'

export default function Log(host, username, message) {
    if (arguments.length === 2) {
        message = username;
        username = "-";
    } else if (arguments.length < 2) {
        host = "-";
        username = "-";
        message = arguments[0];
    }

    console.log('[%s] [%s] [%s] %s', dateFormat("yyyy-mm-dd HH:MM:ss"), host, username, message);
};
