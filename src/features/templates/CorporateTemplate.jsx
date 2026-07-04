import React from 'react';
import { Mail, Phone, Globe, Link2, MapPin } from 'lucide-react';

export const CorporateTemplate = ({ data }) => {
  const { personalInfo = {}, summary = '', experience = [], education = [], skills = [], certifications = [] } = data;

  // Split descriptions by newlines to render as bullets
  const renderDescriptionBullets = (desc) => {
    if (!desc) return null;
    const lines = desc.split('\n').filter(l => l.trim() !== '');
    
    if (lines.length === 1 && !lines[0].startsWith('-')) {
      return <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">{desc}</p>;
    }

    return (
      <ul className="list-disc pl-4 space-y-1 mt-1.5 font-sans">
        {lines.map((line, idx) => {
          const cleanLine = line.replace(/^-\s*/, '').trim();
          return (
            <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {cleanLine}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-white text-slate-900 p-8 sm:p-12 shadow-sm border border-slate-100 max-w-[210mm] min-h-[297mm] mx-auto font-serif relative">
      {/* 1. Header (Personal Info) */}
      <div className="text-center pb-5 border-b-2 border-slate-800 space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-slate-950 font-serif">
          {personalInfo.name || 'Your Full Name'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-600 font-sans">
          {personalInfo.title || 'Professional Title / Target Role'}
        </p>

        {/* Contact Links */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-sans mt-2.5">
          {personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.website && (
            <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition">
              <Globe className="w-3.5 h-3.5" />
              {personalInfo.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {personalInfo.linkedin && (
            <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-slate-800 transition">
              <Link2 className="w-3.5 h-3.5" />
              LinkedIn
            </a>
          )}
        </div>
      </div>

      <div className="space-y-6 mt-6">
        {/* 2. Professional Summary */}
        {summary && (
          <div className="pdf-section space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 font-sans">
              Professional Summary
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify font-sans">
              {summary}
            </p>
          </div>
        )}

        {/* 3. Work Experience */}
        {experience.length > 0 && (
          <div className="pdf-section space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 font-sans">
              Professional Experience
            </h2>
            <div className="space-y-4">
              {experience.map((exp) => (
                <div key={exp.id} className="pdf-item space-y-1">
                  <div className="flex justify-between items-baseline font-sans text-xs">
                    <span className="font-bold text-slate-950">
                      {exp.role || 'Job Role'}
                    </span>
                    <span className="text-slate-600 font-medium">
                      {exp.startDate || 'Start'} – {exp.endDate || 'Present'}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline font-sans text-xs italic text-slate-600">
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
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 font-sans">
              Key Projects
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed text-justify font-sans whitespace-pre-line">
              {personalInfo.projectSummary}
            </p>
          </div>
        )}

        {/* 4. Education */}
        {education.length > 0 && (
          <div className="pdf-section space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 font-sans">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((edu) => (
                <div key={edu.id} className="pdf-item flex justify-between items-baseline font-sans text-xs">
                  <div>
                    <span className="font-bold text-slate-950">{edu.institution || 'School Name'}</span>
                    <span className="text-slate-600"> — {edu.degree || 'Degree Title'}{edu.scoreValue ? ` (${(edu.scoreType || 'cgpa') === 'percentage' ? 'Percentage' : 'CGPA'}: ${edu.scoreValue})` : ''}</span>
                  </div>
                  <span className="text-slate-600 font-medium whitespace-nowrap">
                    {edu.startDate || 'Start'} – {edu.endDate || 'End'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Skills */}
        {skills.length > 0 && (
          <div className="pdf-section space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 font-sans">
              Core Skills
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {skills.join(' • ')}
            </p>
          </div>
        )}

        {/* 6. Certifications */}
        {certifications.length > 0 && (
          <div className="pdf-section space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-950 border-b border-slate-300 pb-1 font-sans">
              Certifications & Affiliations
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">
              {certifications.join(' • ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
