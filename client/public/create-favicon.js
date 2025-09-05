// Node.js script to create favicon using canvas
const fs = require('fs');
const { createCanvas } = require('canvas');

// Create 32x32 favicon
const canvas = createCanvas(32, 32);
const ctx = canvas.getContext('2d');

// Create gradient background
const gradient = ctx.createLinearGradient(0, 0, 32, 32);
gradient.addColorStop(0, '#8b5cf6');
gradient.addColorStop(1, '#7c3aed');

// Fill circular background
ctx.fillStyle = gradient;
ctx.beginPath();
ctx.arc(16, 16, 16, 0, 2 * Math.PI);
ctx.fill();

// Add VR text
ctx.fillStyle = 'white';
ctx.font = 'bold 12px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('VR', 16, 16);

// Add small percentage symbol
ctx.fillStyle = '#a78bfa';
ctx.beginPath();
ctx.arc(25, 7, 3, 0, 2 * Math.PI);
ctx.fill();

ctx.fillStyle = 'white';
ctx.font = 'bold 5px Arial';
ctx.fillText('%', 25, 7);

// Save as PNG
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('favicon.png', buffer);

console.log('Favicon created successfully!');
