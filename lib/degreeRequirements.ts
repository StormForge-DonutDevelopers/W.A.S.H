// src/lib/degreeRequirements.ts

import { title } from "process";

export const DEGREE_REQUIREMENTS = [
  {
      name: "Lower Division Requirements",
      required: 13,
      courses: [
          { 
            title: "CMPT 105W", 
            name: "Social Issues and Communication Strategies in Computing Science", 
            credits: 3,
          },
          { 
            title: "CMPT 120", 
            name: "Introduction to Computing Science and Programming I", 
            credits: 3 
          },
          { 
            title: "CMPT 125", 
            name: "Introduction to Computing Science and Programming II", 
            credits: 3 
          },
          { 
            title: "CMPT 201", 
            name: "Systems Programming", 
            credits: 4 
          },
          { 
            title: "CMPT 210", 
            name: "Probability and Computing", 
            credits: 3 
          },
          { 
            title: "CMPT 225", 
            name: "Data Structures and Programming", 
            credits: 3 
          },
          { 
            title: "CMPT 276", 
            name: "Introduction to Software Engineering", 
            credits: 3 
          },
          { 
            title: "CMPT 295", 
            name: "Introduction to Computer Systems", 
            credits: 4 
          },
          { 
            title: "MACM 101", 
            name: "Discrete Mathematics I", 
            credits: 3 
          },
          { 
            title: "STAT 271", 
            name: "Probability and Statistics for Computing Science", 
            credits: 3 
          },
          { 
            title: "MATH 150/151/154/157", 
            name: "Calculus I",
            credits: 3-4 
          },
          { 
            title: "MATH 152/155/158", 
            name: "Calculus II", 
            credits: 3 
          },
          { 
            title: "MATH 232/240", 
            name: "Linear Algebra", 
            credits: 3 
          }
      ]
  },
  {
      name: "Upper Division Requirements",
      required: 15,
      courses: [
        { title: "CMPT 307", name: "Data Structures and Algorithms", credits: 3 },
        { title: "CMPT 376W", name: "Professional Responsibility and Technical Writing", credits: 3 },
        
        // AI
        { title: "CMPT 310", name: "Introduction to Artificial Intelligence", credits: 3 },
        { title: "CMPT 340", name: "Biomedical Computing", credits: 3 },
        { title: "CMPT 410", name: "Machine Learning", credits: 3 },
        { title: "CMPT 411", name: "Knowledge Representation", credits: 3 },
        { title: "CMPT 413", name: "Computational Linguistics", credits: 3 },
        { title: "CMPT 417", name: "Intelligent Systems", credits: 3 },
        { title: "CMPT 419", name: "Special Topics in Artificial Intelligence", credits: 3 },
        { title: "CMPT 420", name: "Deep Learning", credits: 3 },
        
        // Visual and Interactive Computing
        { title: "CMPT 361", name: "Introduction to Visual Computing", credits: 3 },
        { title: "CMPT 363", name: "User Interface Design", credits: 3 },
        { title: "CMPT 365", name: "Multimedia Systems", credits: 3 },
        { title: "CMPT 412", name: "Computer Vision", credits: 3 },
        { title: "CMPT 461", name: "Computational Photography and Image Manipulation", credits: 3 },
        { title: "CMPT 464", name: "Geometric Modelling in Computer Graphics", credits: 3 },
        { title: "CMPT 466", name: "Animation", credits: 3 },
        { title: "CMPT 467", name: "Visualization", credits: 3 },
        { title: "CMPT 469", name: "Special Topics in Computer Graphics", credits: 3 },

        // Computing Systems
        { title: "CMPT 303", name: "Operating Systems", credits: 3 },
        { title: "CMPT 305", name: "Computer Simulation and Modelling", credits: 3 },
        { title: "CMPT 371", name: "Data Communications and Networking", credits: 3 },
        { title: "CMPT 379", name: "Principles of Compiler Design", credits: 3 },
        { title: "CMPT 403", name: "System Security and Privacy", credits: 3 },
        { title: "CMPT 431", name: "Distributed Systems", credits: 3 },
        { title: "CMPT 433", name: "Embedded Systems", credits: 3 },
        { title: "CMPT 450", name: "Computer Architecture", credits: 3 },
        { title: "CMPT 471", name: "Networking II", credits: 3 },
        { title: "CMPT 479", name: "Special Topics in Computing Systems", credits: 3 },
        { title: "CMPT 499", name: "Special Topics in Computer Hardware", credits: 3 },

        // Information Systems
        { title: "CMPT 353", name: "Computational Data Science", credits: 3 },
        { title: "CMPT 354", name: "Database Systems I", credits: 3 },
        { title: "CMPT 362", name: "Mobile Applications Programming and Design", credits: 3 },
        { title: "CMPT 372", name: "Web II - Server-side Development", credits: 3 },
        { title: "CMPT 441", name: "Computational Biology", credits: 3 },
        { title: "CMPT 454", name: "Database Systems II", credits: 3 },
        { title: "CMPT 456", name: "Information Retrieval and Web Search", credits: 3 },
        { title: "CMPT 459", name: "Special Topics in Database Systems", credits: 3 },
        { title: "CMPT 474", name: "Web Systems Architecture", credits: 3 },
        
        // Programming Languages and Software
        { title: "CMPT 373", name: "Software Development Methods", credits: 3 },
        { title: "CMPT 383", name: "Comparative Programming Languages", credits: 3 },
        { title: "CMPT 384", name: "Symbolic Computing", credits: 3 },
        { title: "CMPT 473", name: "Software Testing, Reliability and Security", credits: 3 },
        { title: "CMPT 475", name: "Requirements Engineering", credits: 3 },
        { title: "CMPT 477", name: "Introduction to Formal Verification", credits: 3 },
        { title: "CMPT 489", name: "Special Topics in Programming Languages", credits: 3 },
        
        // Theoretical Computing Science
        { title: "CMPT 308", name: "Computability and Complexity", credits: 3 },
        { title: "CMPT 404", name: "Cryptography and Cryptographic Protocols", credits: 3 },
        { title: "CMPT 405", name: "Design and Analysis of Computing Algorithms", credits: 3 },
        { title: "CMPT 406", name: "Computational Geometry", credits: 3 },
        { title: "CMPT 407", name: "Computational Complexity", credits: 3 },
        { title: "CMPT 409", name: "Special Topics in Theoretical Computing Science", credits: 3 },
        { title: "CMPT 476", name: "Introduction to Quantum Algorithms", credits: 3 },
        { title: "MACM 300", name: "Introduction to Formal Languages and Automata with Applications", credits: 3 },

        // Computing Mathematics Courses
        { title: "MACM 316", name: "Numerical Analysis I", credits: 3 },
        { title: "MACM 401", name: "Introduction to Computer Algebra", credits: 3 },
        { title: "MACM 442", name: "Cryptography", credits: 3 },
        { title: "MATH 308", name: "Linear Optimization", credits: 3 },
        { title: "MATH 340", name: "Algebra II: Rings and Fields", credits: 3 },
        { title: "MATH 343", name: "Applied Discrete Mathematics", credits: 3 },

        // Other Courses Per Department Approval
        { title: "CMPT 318", name: "Special Topics in Computing Science", credits: 3 },
        { title: "CMPT 415", name: "Special Research Projects", credits: 3 },
        { title: "CMPT 416", name: "Special Research Projects", credits: 3 },
        { title: "CMPT 496", name: "Directed Studies", credits: 3 },
        { title: "CMPT 497", name: "Dual Degree Program Capstone Project", credits: 6 },
        { title: "CMPT 498", name: "Honours Research Project", credits: 6 },
      ]
  },
  {
      name: "Breadth Requirement",
      required: 6,
      courses: [
        { title: "ARCH 131", name: "Human Origins", credits: 3 },
        { title: "CA 149", name: "Sound", credits: 3 },
        { title: "HIST 102W", name: "Canada since Confederation", credits: 3 },
        { title: "PHIL 105", name: "Critical Thinking", credits: 3 },
        { title: "PSYC 100", name: "Introduction to Psychology I", credits: 3 },
      ]
  },
];