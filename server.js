require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const {Employee, Project, ProjectAssignment, initializeDatabase} = require('./database');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


initializeDatabase();


app.post('/api/employees', async (req, res) => {
  try {
    const newEmployee = new Employee(req.body);
    await newEmployee.save();
    res.status(201).send(newEmployee);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).send('Employee ID must be unique');
    } else {
      res.status(500).send('Internal server error:', error);
    }
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const newProject = new Project(req.body);
    await newProject.save();
    res.status(201).send(newProject);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).send('Project code must be unique');
    } else {
      res.status(500).send('Internal server error:', error);
    }
  }
});

app.post('/api/project_assignments', async (req, res) => {
  try {
    const newAssignment = new ProjectAssignment(req.body);
    await newAssignment.save();
    res.status(201).send(newAssignment);
  } catch (error) {
    res.status(500).send('Internal server error:', error);
  }
});

app.get('/api/project_assignments', async (req, res) => {
  try {
    const projectAssignments = await ProjectAssignment.find().limit(5).sort({ start_date: -1})  
      .populate('employee_id', 'full_name')
      .populate('project_code', 'project_name');

    const detailedAssignments = await Promise.all(
      projectAssignments.map(async (assignment) => {
        const employee = await Employee.findOne({ _id: assignment.employee_id });
        const project = await Project.findOne({ _id: assignment.project_code });

        return {
          employee_id: assignment.employee_id,
          employee_name: employee ? employee.full_name : "Unknown",
          project_name: project ? project.project_name : "Unknown",
          start_date: assignment.start_date
        };
      })
    );

    res.status(200).send(detailedAssignments);
  } catch (error) {
    console.error('Error fetching project assignments:', error);
    res.status(500).send('Error fetching project assignments');
  }
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

