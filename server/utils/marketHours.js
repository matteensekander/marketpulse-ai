function isMarketOpen() {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const day = nyTime.getDay();
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  if (day === 0 || day === 6) return false;
  return timeInMinutes >= 570 && timeInMinutes < 960; // 9:30am - 4:00pm ET
}

function getMarketStatus() {
  const now = new Date();
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const hour = nyTime.getHours();
  const minute = nyTime.getMinutes();
  const timeInMinutes = hour * 60 + minute;
  if (isMarketOpen()) return 'OPEN';
  if (timeInMinutes >= 480 && timeInMinutes < 570) return 'PRE-MARKET';
  if (timeInMinutes >= 960 && timeInMinutes < 1200) return 'AFTER-HOURS';
  return 'CLOSED';
}

module.exports = { isMarketOpen, getMarketStatus };
