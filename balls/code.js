
const TWO_PI = Math.PI * 2;

class Vector2 
{
    constructor(x = 0, y = 0) 
    {
        this.x = x;
        this.y = y;
    }

    add(other) 
    {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    subtract(other) 
    {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) 
    {
        return new Vector2(this.x * scalar, this.y * scalar);
    }

    divide(scalar) 
    {
        if (scalar === 0) 
        {
            return new Vector2();
        }
        const res = 1 / scalar;
        return new Vector2(this.x * res, this.y * res);
    }

    length() 
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    length_squared() 
    {
        return this.x * this.x + this.y * this.y;
    }

    normalized() 
    {
        const mag = this.length();
        if (mag > 0) 
        {
            return this.divide(mag);
        }
        return new Vector2();
    }

    addthis(other) 
    {
        this.x += other.x;
        this.y += other.y;
        return this;
    }
    
    multiplythis(scalar) 
    {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    reverse() 
    {
        return new Vector2(-this.x, -this.y);
    }

    rotate(angle) 
    {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const newX = this.x * cos - this.y * sin;
    const newY = this.x * sin + this.y * cos;
    
    this.x = newX;
    this.y = newY; 
    }
}

function dot(a, b) 
{
    return a.x * b.x + a.y * b.y;
}

class RigidBody 
{
    constructor(position, mass = 1, dampening = 0.9) 
    {
        this.position = position;
        this.mass = mass;
        this.inv_mass = 1 / this.mass;
        this.velocity = new Vector2();
        this.acceleration = new Vector2();
        this.temp_total_force = new Vector2();
        this.dampening = dampening
    }

    update(delta_time)
    {
        this.acceleration = this.temp_total_force.multiply(this.inv_mass);
        this.temp_total_force.x = 0;
        this.temp_total_force.y = 0;

        this.velocity.addthis(this.acceleration.multiply(delta_time));
        this.velocity.multiplythis(this.dampening ** delta_time);
        this.position.addthis(this.velocity.multiply(delta_time));
        
        this.acceleration.x = 0;
        this.acceleration.y = 0;
    }

    add_force(force)
    {
        this.temp_total_force.addthis(force);
    }

    add_impulse(impulse)
    {
        this.velocity.addthis(impulse.multiply(this.inv_mass));
    }
}

class Circle 
{
    constructor(position, radius = 20, color = 'white') 
    {
        this.position = position;
        this.radius = radius;
        this.color = color; // '#FFFFFF', 'rgb(255, 255, 255)', 'white'
    }

    draw(ctx) 
    { 
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, TWO_PI);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

class CircleCollider 
{
    constructor(position, rigidBody, radius, elasticity = 1) 
    {
        this.position = position;
        this.rigidBody = rigidBody;
        this.radius = radius;
        this.elasticity = elasticity
    }
}

class Ball 
{
    constructor(position, color = 'white', radius = 20, mass = 1, dampening = 0.9) 
    {
        this.rigid_body = new RigidBody(position, mass, dampening);
        this.circle = new Circle(this.rigid_body.position, radius, color); 
        this.collider = new CircleCollider(this.rigid_body.position, this.rigid_body, radius);
    }

    update(deltaTime) 
    {
        this.rigid_body.update(deltaTime);
    }

    draw(ctx) 
    {
        this.circle.draw(ctx);
    }
}

class ContactPoint
{
	constructor(depth, normal, coll1, coll2)
	{
		this.depth = depth;
		this.normal = normal;
		this.coll1 = coll1;
		this.coll2 = coll2;
	}
}

function check_collision(coll1, coll2)
{
    const distance_vector = coll2.position.subtract(coll1.position);
    const distance_sq = distance_vector.length_squared();

    if (distance_sq === 0) 
    {
        const depth = coll1.radius + coll2.radius;
        const normal = new Vector2(1, 0);
        
        coll1.position.x += 0.001;
        coll1.position.y += 0.001;
        
        return new ContactPoint(depth, normal, coll1, coll2);
    }
    
    const radius_sum = coll1.radius + coll2.radius;
    const radius_sum_sq = radius_sum ** 2;
    
	if (radius_sum_sq > distance_sq)
	{
		const distance = Math.sqrt(distance_sq);
		const depth = radius_sum - distance;
		const normal = distance_vector.normalized();
		return new ContactPoint(depth, normal, coll1, coll2);
	}
    return null;
}

function correct_colliders(contact_point)
{
	const correction_vector = contact_point.normal.multiply(contact_point.depth);
	const correction1 = correction_vector.multiply(-0.5);
    contact_point.coll1.position.addthis(correction1);
	const correction2 = correction_vector.multiply(0.5);
    contact_point.coll2.position.addthis(correction2);
}

function apply_impact_force(contact_point)
{
	const rb1 = contact_point.coll1.rigidBody;
    const rb2 = contact_point.coll2.rigidBody;
    const relative_velocity = rb2.velocity.subtract(rb1.velocity);
    const effective_relative_velocity = dot(relative_velocity, contact_point.normal);

    if (effective_relative_velocity > 0) return;

    const e = Math.min(contact_point.coll1.elasticity, contact_point.coll2.elasticity);
    const j = (-(1 + e) * effective_relative_velocity) / (rb1.inv_mass + rb2.inv_mass);
    const impulse_vector = contact_point.normal.multiply(j);
    rb1.add_impulse(impulse_vector.reverse());
    rb2.add_impulse(impulse_vector);
}

function resolve_circle_collision(contact_point)
{
	apply_impact_force(contact_point);
	correct_colliders(contact_point);
}

function resolve_all_collisions(collider_list)
{
	const n = collider_list.length; 

    for (let i = 0; i < n - 1; i++) 
    {
        const coll1 = collider_list[i];

        for (let j = i + 1; j < n; j++) 
        {
            const coll2 = collider_list[j];

            const contact_point = check_collision(coll1, coll2);

            if (contact_point instanceof ContactPoint)
                resolve_circle_collision(contact_point);
            
        }
    }
}

function reflection(ball) 
{
    const pos = ball.rigid_body.position;
    const radius = ball.collider.radius;

    if (pos.x < radius)
    {
        ball.rigid_body.velocity.x = Math.abs(ball.rigid_body.velocity.x);
        pos.x = radius;
    }
    if (pos.y < radius)
    {
        ball.rigid_body.velocity.y = Math.abs(ball.rigid_body.velocity.y);
        pos.y = radius;
    }
    if (pos.x > canvas.width -radius)
    {
        ball.rigid_body.velocity.x = -Math.abs(ball.rigid_body.velocity.x);
        pos.x = canvas.width - radius;
    }
    if (pos.y > canvas.height -radius)
    {
        ball.rigid_body.velocity.y = -Math.abs(ball.rigid_body.velocity.y);
        pos.y = canvas.height - radius;
    }
}

function push_ball() 
{
    const force = direction.multiply(force_multiplayer);
    balls[0].rigid_body.add_force(force);
}

function rotate_direction(angle) 
{
    direction.rotate(angle);
}

function draw_aim() {
    const normalized_direction = direction.normalized(); 
    const point_distance = 45; 

    for (let i = 1; i < 15; i++)
    {
        const pos = balls[0].rigid_body.position.add(
            normalized_direction.multiply(i * point_distance) 
        );

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, TWO_PI); 
        ctx.fillStyle = 'red';
        ctx.fill();
    }
}

function change_force_multiplayer(value)
{
    const newForce = parseFloat(value);
    if (!isNaN(newForce))
        force_multiplayer = newForce;
}

function change_width(value)
{
    const newWidth = parseFloat(value);
    
    if (!isNaN(newWidth) && newWidth >= 0)
        canvas.width = newWidth;
}

function change_height(value)
{
    const newHeight = parseFloat(value);
    
    if (!isNaN(newHeight) && newHeight >= 0)
        canvas.height = newHeight;
}

function change_size(value)
{
    const newSize = parseFloat(value);
    
    if (!isNaN(newSize) && newSize >= 0)
        size = newSize;
}

function add_ball(radius=20, color='white', position=new Vector2(canvas.width/2, canvas.height/2))
{
    const ball = new Ball(
        position,
        color,
        radius,
        1
    );
    balls.push(ball);
    colliders.push(ball.collider);
}

function remove_ball()
{
    if (balls.length === 1) return;
    colliders.pop();
    balls.pop();
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 500;

var force_multiplayer = 5000;
var size = 20;
const direction = new Vector2(1, 0);
const FPS = 60;
const delta = 1 / FPS;

let colliders = [];
let balls = [];

add_ball()
balls[0].circle.color = 'lime';

function gameLoop()
{
    ctx.fillStyle = 'black';
    ctx.fillRect(1, 1, canvas.width -2, canvas.height -2);

    for (const ball of balls)
    {
        reflection(ball);
    	ball.update(delta);
    }
    
    resolve_all_collisions(colliders)

    for (const ball of balls)
    {
    	ball.draw(ctx);
    }
    draw_aim();

    requestAnimationFrame(gameLoop);
}
gameLoop();
