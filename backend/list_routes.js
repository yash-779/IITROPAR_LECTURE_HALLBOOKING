const express = require('express');
const app = express();
const routes = require('./routes/bookingRoutes');
app.use('/api/bookings', routes);

console.log("Registered Booking Routes:");
app._router.stack.forEach(r => {
  if (r.name === 'router' && r.handle.stack) {
    r.handle.stack.forEach(s => {
      console.log(Object.keys(s.route.methods)[0].toUpperCase() + ' ' + s.route.path);
    });
  }
});
