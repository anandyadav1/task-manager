import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log('🗑️  Cleaned existing data');

  // ─── Create Users ──────────────────────────────────────
  const hashedPassword = async (pw) => bcrypt.hash(pw, 12);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@demo.com',
      password: await hashedPassword('Admin@123'),
      role: 'ADMIN',
      isVerified: true,
      avatar: null,
    },
  });

  const manager = await prisma.user.create({
    data: {
      name: 'Sarah Manager',
      email: 'manager@demo.com',
      password: await hashedPassword('Manager@123'),
      role: 'MEMBER',
      isVerified: true,
      avatar: null,
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@demo.com',
      password: await hashedPassword('Alice@123'),
      role: 'MEMBER',
      isVerified: true,
      avatar: null,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Wilson',
      email: 'bob@demo.com',
      password: await hashedPassword('Bob@123'),
      role: 'MEMBER',
      isVerified: true,
      avatar: null,
    },
  });

  console.log('👤 Created 4 users');

  // ─── Create Tags ───────────────────────────────────────
  const tagFrontend = await prisma.tag.create({ data: { name: 'Frontend', color: '#3b82f6' } });
  const tagBackend = await prisma.tag.create({ data: { name: 'Backend', color: '#10b981' } });
  const tagBug = await prisma.tag.create({ data: { name: 'Bug', color: '#ef4444' } });
  const tagFeature = await prisma.tag.create({ data: { name: 'Feature', color: '#8b5cf6' } });
  const tagDesign = await prisma.tag.create({ data: { name: 'Design', color: '#f59e0b' } });
  const tagDevOps = await prisma.tag.create({ data: { name: 'DevOps', color: '#06b6d4' } });
  const tagDocs = await prisma.tag.create({ data: { name: 'Documentation', color: '#64748b' } });
  const tagUX = await prisma.tag.create({ data: { name: 'UX', color: '#ec4899' } });

  console.log('🏷️  Created 8 tags');

  // ─── Create Project 1: E-Commerce Platform ────────────
  const project1 = await prisma.project.create({
    data: {
      name: 'E-Commerce Platform',
      description:
        'Build a modern e-commerce platform with product catalog, shopping cart, checkout, payment integration, and order management. Target launch: Q2 2026.',
      status: 'ACTIVE',
      deadline: new Date('2026-06-30'),
      tags: { connect: [{ id: tagFrontend.id }, { id: tagBackend.id }, { id: tagFeature.id }] },
    },
  });

  // Add members to project 1
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: admin.id, role: 'OWNER' },
      { projectId: project1.id, userId: manager.id, role: 'MANAGER' },
      { projectId: project1.id, userId: alice.id, role: 'MEMBER' },
      { projectId: project1.id, userId: bob.id, role: 'MEMBER' },
    ],
  });

  // Project 1 tasks (12 tasks)
  const p1Tasks = [
    { title: 'Design product catalog UI', description: 'Create wireframes and high-fidelity mockups for the product catalog page including filters, search, and grid/list views.', status: 'DONE', priority: 'HIGH', assignedToId: alice.id, dueDate: new Date('2026-04-15'), tags: [tagDesign.id, tagUX.id] },
    { title: 'Implement user authentication', description: 'Set up JWT-based authentication with register, login, password reset, and email verification.', status: 'DONE', priority: 'URGENT', assignedToId: bob.id, dueDate: new Date('2026-04-20'), tags: [tagBackend.id] },
    { title: 'Build product listing API', description: 'RESTful API for products CRUD with pagination, filtering, and search capabilities.', status: 'DONE', priority: 'HIGH', assignedToId: bob.id, dueDate: new Date('2026-04-25'), tags: [tagBackend.id, tagFeature.id] },
    { title: 'Create shopping cart component', description: 'React component for shopping cart with add, remove, update quantity, and price calculation.', status: 'IN_PROGRESS', priority: 'HIGH', assignedToId: alice.id, dueDate: new Date('2026-05-10'), tags: [tagFrontend.id] },
    { title: 'Payment gateway integration', description: 'Integrate Stripe for payment processing including card payments, refunds, and webhooks.', status: 'TODO', priority: 'URGENT', assignedToId: bob.id, dueDate: new Date('2026-05-20'), tags: [tagBackend.id, tagFeature.id] },
    { title: 'Order management dashboard', description: 'Admin dashboard for viewing, filtering, and managing customer orders with status updates.', status: 'TODO', priority: 'MEDIUM', assignedToId: manager.id, dueDate: new Date('2026-05-25'), tags: [tagFrontend.id, tagFeature.id] },
    { title: 'Fix cart total calculation bug', description: 'Cart total shows wrong amount when discount codes are applied. Need to fix the calculation logic.', status: 'IN_REVIEW', priority: 'HIGH', assignedToId: alice.id, dueDate: new Date('2026-05-05'), tags: [tagBug.id, tagFrontend.id] },
    { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing, linting, and deployment to staging/production.', status: 'IN_PROGRESS', priority: 'MEDIUM', assignedToId: bob.id, dueDate: new Date('2026-05-15'), tags: [tagDevOps.id] },
    { title: 'Write API documentation', description: 'Document all API endpoints using Swagger/OpenAPI spec. Include request/response examples.', status: 'TODO', priority: 'LOW', assignedToId: manager.id, dueDate: new Date('2026-06-01'), tags: [tagDocs.id] },
    { title: 'Product image optimization', description: 'Implement image upload with automatic resizing, compression, and CDN delivery for product images.', status: 'TODO', priority: 'MEDIUM', assignedToId: alice.id, dueDate: new Date('2026-05-30'), tags: [tagBackend.id, tagFeature.id] },
    { title: 'Email notification templates', description: 'Design and implement email templates for order confirmation, shipping updates, and promotional emails.', status: 'TODO', priority: 'LOW', assignedToId: manager.id, dueDate: new Date('2026-06-10'), tags: [tagDesign.id, tagFeature.id] },
    { title: 'Performance optimization', description: 'Analyze and optimize page load times, implement lazy loading, code splitting, and caching strategies.', status: 'TODO', priority: 'MEDIUM', assignedToId: bob.id, dueDate: new Date('2026-06-15'), tags: [tagFrontend.id, tagDevOps.id] },
  ];

  for (let i = 0; i < p1Tasks.length; i++) {
    const { tags, ...taskData } = p1Tasks[i];
    await prisma.task.create({
      data: {
        ...taskData,
        projectId: project1.id,
        createdById: admin.id,
        order: i,
        tags: { connect: tags.map((id) => ({ id })) },
      },
    });
  }

  console.log('📋 Created Project 1 with 12 tasks');

  // ─── Create Project 2: Mobile App Redesign ────────────
  const project2 = await prisma.project.create({
    data: {
      name: 'Mobile App Redesign',
      description:
        'Complete redesign of the mobile application with new UI/UX, improved navigation, dark mode, and performance enhancements. Focus on user retention and engagement.',
      status: 'ACTIVE',
      deadline: new Date('2026-05-31'),
      tags: { connect: [{ id: tagDesign.id }, { id: tagUX.id }, { id: tagFrontend.id }] },
    },
  });

  await prisma.projectMember.createMany({
    data: [
      { projectId: project2.id, userId: manager.id, role: 'OWNER' },
      { projectId: project2.id, userId: alice.id, role: 'MANAGER' },
      { projectId: project2.id, userId: bob.id, role: 'MEMBER' },
    ],
  });

  // Project 2 tasks (8 tasks, including overdue ones)
  const p2Tasks = [
    { title: 'User research & interviews', description: 'Conduct 20 user interviews and create user personas. Document pain points and feature requests.', status: 'DONE', priority: 'HIGH', assignedToId: alice.id, dueDate: new Date('2026-03-15'), tags: [tagUX.id] },
    { title: 'New navigation flow', description: 'Design and prototype the new bottom navigation with gesture-based interactions.', status: 'DONE', priority: 'HIGH', assignedToId: alice.id, dueDate: new Date('2026-03-30'), tags: [tagDesign.id, tagUX.id] },
    { title: 'Dark mode implementation', description: 'Implement dark mode with system preference detection and manual toggle. Update all components.', status: 'IN_PROGRESS', priority: 'MEDIUM', assignedToId: bob.id, dueDate: new Date('2026-04-25'), tags: [tagFrontend.id, tagDesign.id] },
    { title: 'Onboarding redesign', description: 'Create new onboarding flow with animated illustrations and progressive disclosure.', status: 'IN_REVIEW', priority: 'HIGH', assignedToId: alice.id, dueDate: new Date('2026-04-20'), tags: [tagDesign.id, tagUX.id] },
    { title: 'Push notification system', description: 'Implement push notifications with Firebase Cloud Messaging. Include notification preferences.', status: 'TODO', priority: 'URGENT', assignedToId: bob.id, dueDate: new Date('2026-04-28'), tags: [tagBackend.id, tagFeature.id] },
    { title: 'App store listing update', description: 'Update screenshots, description, and promotional graphics for both App Store and Play Store.', status: 'TODO', priority: 'LOW', assignedToId: manager.id, dueDate: new Date('2026-05-20'), tags: [tagDesign.id] },
    { title: 'Fix login screen crash on Android', description: 'App crashes on Android 12+ devices when entering password. Stack trace points to keyboard input handler.', status: 'IN_PROGRESS', priority: 'URGENT', assignedToId: bob.id, dueDate: new Date('2026-04-18'), tags: [tagBug.id] },
    { title: 'Performance profiling', description: 'Profile app startup time and reduce cold start to under 2 seconds. Optimize bundle size.', status: 'TODO', priority: 'HIGH', assignedToId: bob.id, dueDate: new Date('2026-05-10'), tags: [tagDevOps.id] },
  ];

  for (let i = 0; i < p2Tasks.length; i++) {
    const { tags, ...taskData } = p2Tasks[i];
    await prisma.task.create({
      data: {
        ...taskData,
        projectId: project2.id,
        createdById: manager.id,
        order: i,
        tags: { connect: tags.map((id) => ({ id })) },
      },
    });
  }

  console.log('📋 Created Project 2 with 8 tasks');

  // ─── Create Comments ──────────────────────────────────
  const allTasks = await prisma.task.findMany({ take: 5 });

  const commentData = [
    { content: 'Great progress on this! The mockups look very clean. Let\'s schedule a review session with the team.', taskId: allTasks[0]?.id, userId: manager.id },
    { content: 'I\'ve pushed the initial implementation. Ready for code review. Please check the error handling.', taskId: allTasks[1]?.id, userId: bob.id },
    { content: 'Found a few edge cases we should handle — what happens when the API rate limit is hit?', taskId: allTasks[1]?.id, userId: admin.id },
    { content: 'The filter component is working well. Added debounce to the search input for better performance.', taskId: allTasks[2]?.id, userId: bob.id },
    { content: 'Can we add a loading skeleton instead of a spinner? It would improve the perceived performance.', taskId: allTasks[3]?.id, userId: alice.id },
    { content: 'Updated the cart component to use the new pricing API. All edge cases are covered now.', taskId: allTasks[3]?.id, userId: alice.id },
    { content: 'This needs to be prioritized — several users have reported this issue in the last week.', taskId: allTasks[4]?.id, userId: manager.id },
  ];

  for (const comment of commentData) {
    if (comment.taskId) {
      await prisma.comment.create({ data: comment });
    }
  }

  console.log('💬 Created sample comments');

  // ─── Create Activity Logs ─────────────────────────────
  const activities = [
    { userId: admin.id, action: 'CREATED_PROJECT', entity: 'project', entityId: project1.id, meta: { name: 'E-Commerce Platform' } },
    { userId: manager.id, action: 'CREATED_PROJECT', entity: 'project', entityId: project2.id, meta: { name: 'Mobile App Redesign' } },
    { userId: admin.id, action: 'INVITED_MEMBER', entity: 'project', entityId: project1.id, meta: { email: 'manager@demo.com', role: 'MANAGER' } },
    { userId: admin.id, action: 'CREATED_TASK', entity: 'task', entityId: allTasks[0]?.id || project1.id, meta: { title: 'Design product catalog UI' } },
    { userId: bob.id, action: 'UPDATED_STATUS', entity: 'task', entityId: allTasks[1]?.id || project1.id, meta: { from: 'TODO', to: 'DONE' } },
    { userId: alice.id, action: 'ADDED_COMMENT', entity: 'task', entityId: allTasks[0]?.id || project1.id, meta: {} },
    { userId: manager.id, action: 'ASSIGNED_MEMBER', entity: 'task', entityId: allTasks[3]?.id || project1.id, meta: { assignedTo: 'Alice Johnson' } },
  ];

  for (const activity of activities) {
    await prisma.activityLog.create({ data: activity });
  }

  console.log('📝 Created activity logs');

  // ─── Create Notifications ─────────────────────────────
  const notifications = [
    { userId: alice.id, message: 'You\'ve been assigned "Create shopping cart component"', type: 'TASK_ASSIGNED', link: `/projects/${project1.id}` },
    { userId: bob.id, message: 'Task "Fix login screen crash on Android" is overdue!', type: 'TASK_DUE', link: `/projects/${project2.id}` },
    { userId: manager.id, message: 'New comment on "Design product catalog UI"', type: 'COMMENT', link: `/projects/${project1.id}` },
    { userId: alice.id, message: 'You\'ve been invited to "Mobile App Redesign"', type: 'PROJECT_INVITE', link: `/projects/${project2.id}` },
    { userId: bob.id, message: 'Task "Dark mode implementation" status changed to IN_PROGRESS', type: 'TASK_ASSIGNED', link: `/projects/${project2.id}` },
  ];

  for (const notif of notifications) {
    await prisma.notification.create({ data: notif });
  }

  console.log('🔔 Created sample notifications');

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('🌱 Seed completed successfully!');
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('Demo Accounts:');
  console.log('  Admin:   admin@demo.com    / Admin@123');
  console.log('  Manager: manager@demo.com  / Manager@123');
  console.log('  Alice:   alice@demo.com    / Alice@123');
  console.log('  Bob:     bob@demo.com      / Bob@123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
