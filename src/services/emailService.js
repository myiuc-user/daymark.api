import Handlebars from 'handlebars';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Load and compile templates
const loadTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../views/emails', `${templateName}.hbs`);
  const templateContent = fs.readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateContent);
};

const compiledTemplates = {
  invitation: loadTemplate('invitation'),
  taskAssignment: loadTemplate('taskAssignment'),
  projectUpdate: loadTemplate('projectUpdate')
};

export const sendInvitationEmail = async (email, workspaceName, inviteLink, userName = 'there') => {
  const html = compiledTemplates.invitation({ workspaceName, inviteLink, userName });
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `🚀 Join ${workspaceName} - Your collaboration awaits`,
    html
  });
};

export const sendTaskAssignmentEmail = async (email, taskData) => {
  const html = compiledTemplates.taskAssignment({
    taskTitle: taskData.title,
    taskDescription: taskData.description,
    projectName: taskData.projectName,
    taskPriority: taskData.priority,
    dueDate: taskData.dueDate,
    taskLink: taskData.taskLink
  });
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `📋 New Task: ${taskData.title}`,
    html
  });
};

export const sendProjectUpdateEmail = async (email, updateData) => {
  const html = compiledTemplates.projectUpdate({
    projectName: updateData.projectName,
    updateTitle: updateData.title,
    updateMessage: updateData.message,
    projectLink: updateData.projectLink
  });
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: `📊 ${updateData.title}`,
    html
  });
};
