import React from 'react';
import { Mail, Phone, Globe, Link2, MapPin, Award } from 'lucide-react';

export const ModernTemplate = ({ data }) => {
  const { personalInfo = {}, summary = '', experience = [], education = [], skills = [], certifications = [] } = data;

  const renderDescriptionBullets = (desc) => {
    if (!desc) return null;
    const lines = desc.split('\n').filter(l => l.trim() !== '');
    
    if (lines.length === 1 && !lines[0].startsWith('-')) {
      return <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>;
    }

    return (
      <ul className="list-disc pl-4 space-y-1 mt-1 text-[11px] text-slate-600 dark:text-slate-300">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^-\s*/, '').trim();
          return (
            <li key={idx} className="leading-relaxed">
              {cleanLine}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-white text-slate-800 p-8 sm:p-10 shadow-sm border border-slate-100 max-w-[210mm] min-h-[297mm] mx-auto font-sans relative">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 pb-6 border-b border-slate-200/80 mb-6">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          {personalInfo.photoUrl && (
            <img
              src={personalInfo.photoUrl}
              alt={personalInfo.name || 'Profile'}
              className="w-16 h-16 rounded-full object-cover border-2 border-primary-500 shadow-sm"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {personalInfo.name || 'Your Full Name'}
            </h1>
            <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
              {personalInfo.title || 'Professional Title / Target Role'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Main Column (Left, 8 cols) */}
        <div className="md:col-span-8 space-y-6">
          {/* Summary */}
          {summary && (
            <div className="pdf-section space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 border-l-4 border-primary-500 pl-2.5">
                Profile
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-justify">
                {summary}
              </p>
            </div>
          )}

          {/* Work Experience */}
          {experience.length > 0 && (
            <div className="pdf-section space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 border-l-4 border-primary-500 pl-2.5">
                Experience
              </h2>
              <div className="space-y-4">
                {experience.map((exp) => (
                  <div key={exp.id} className="pdf-item space-y-1">
                    <div className="flex justify-between items-baseline text-xs font-bold text-slate-900">
                      <span>{exp.role || 'Job Role'}</span>
                      <span className="text-[10px] text-primary-600 font-semibold">{exp.startDate || 'Start'} – {exp.endDate || 'Present'}</span>
                    </div>
                    <div className="flex justify-between items-baseline text-[10px] text-slate-500 italic">
                      <span>{exp.company || 'Company Name'}</span>
                      <span>{exp.location || 'Location'}</span>
                    </div>
                    {renderDescriptionBullets(exp.description)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Summary */}
          {personalInfo.projectSummary && (
            <div className="pdf-section space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 border-l-4 border-primary-500 pl-2.5">
                Key Projects
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed text-justify whitespace-pre-line">
                {personalInfo.projectSummary}
              </p>
            </div>
          )}

          {/* Education */}
          {education.length > 0 && (
            <div className="pdf-section space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-900 border-l-4 border-primary-500 pl-2.5">
                Education
              </h2>
              <div className="space-y-3">
                {education.map((edu) => (
                  <div key={edu.id} className="pdf-item flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{edu.institution || 'School Name'}</span>
                      <span className="text-slate-500 font-medium"> — {edu.degree || 'Degree'}{edu.scoreValue ? ` (${(edu.scoreType || 'cgpa') === 'percentage' ? 'Percentage' : 'CGPA'}: ${edu.scoreValue})` : ''}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      {edu.startDate || 'Start'} – {edu.endDate || 'End'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column (Right, 4 cols) */}
        <div className="md:col-span-4 bg-slate-50 p-5 rounded-2xl h-fit border border-slate-100 space-y-6">
          
          {/* Contact Details */}
          <div className="pdf-section space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">
              Contact
            </h3>
            <div className="space-y-2.5 text-[11px] text-slate-600">
              {personalInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                  <span className="truncate">{personalInfo.email}</span>
                </div>
              )}
              {personalInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                  <span>{personalInfo.phone}</span>
                </div>
              )}
              {personalInfo.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                  <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 truncate transition">
                    {personalInfo.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {personalInfo.linkedin && (
                <div className="flex items-center gap-2">
                  <Link2 className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                  <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary-600 truncate transition">
                    LinkedIn URL
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Skills tags */}
          {skills.length > 0 && (
            <div className="pdf-section space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">
                Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <div className="pdf-section space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">
                Certifications
              </h3>
              <ul className="space-y-2 text-[11px] text-slate-600">
                {certifications.map((cert, index) => (
                  <li key={index} className="flex items-start gap-1.5 leading-relaxed">
                    <Award className="w-3.5 h-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>{cert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
