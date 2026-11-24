/** Rebote contra las paredes del tablero, manteniendo el objeto dentro. */
export function bounceInside(body, world, margin) {
  let bounced = false;
  if (body.x < margin) {
    body.x = margin;
    body.vx = Math.abs(body.vx);
    bounced = true;
  } else if (body.x > world.width - margin) {
    body.x = world.width - margin;
    body.vx = -Math.abs(body.vx);
    bounced = true;
  }
  if (body.y < margin) {
    body.y = margin;
    body.vy = Math.abs(body.vy);
    bounced = true;
  } else if (body.y > world.height - margin) {
    body.y = world.height - margin;
    body.vy = -Math.abs(body.vy);
    bounced = true;
  }
  return bounced;
}
