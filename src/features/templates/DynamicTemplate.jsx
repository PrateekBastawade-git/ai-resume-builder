import React from 'react';
import { Mail, Phone, Globe, Link2, Award, BookOpen, Briefcase, GraduationCap, Code, Globe2, MapPin } from 'lucide-react';

export const DynamicTemplate = ({ data = {} }) => {
  const {
    personalInfo = {},
    summary = '',
    experience = [],
    projects = [],
    education = [],
    skills = [],
    certifications = [],
    languages = [],
    links = [],
    customLayout = {}
  } = data;

  // Layout parameters
  const layoutType = customLayout.type || data.template || 'Professional';
  const fontFamily = customLayout.fontFamily || 'Inter';
  const headingStyle = customLayout.headingStyle || 'bold-underline';
  const isTwoColumn = customLayout.columns === 2 || layoutType.toLowerCase().includes('two column') || layoutType.toLowerCase() === 'creative';
  const accentColor = customLayout.accentColor || '#2563eb';
  const sectionOrder = customLayout.sectionOrder || ['summary', 'experience', 'projects', 'education', 'skills', 'certifications', 'languages', 'links'];

  // Font mapping
  const getFontClass = () => {
    const f = fontFamily.toLowerCase();
    if (f.includes('serif') || f.includes('playfair') || f.includes('georgia')) return 'font-serif';
    if (f.includes('mono')) return 'font-mono';
    return 'font-sans';
  };

  // Heading styles mapping
  const renderSectionHeader = (title) => {
    switch (headingStyle) {
      case 'uppercase':
        return (
          <h2 className="text-sm font-bold uppercase tracking-widest pb-1 mb-3" style={{ color: accentColor }}>
            {title}
          </h2>
        );
      case 'colored-box':
        return (
          <h2 className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 mb-3 rounded text-white" style={{ backgroundColor: accentColor }}>
            {title}
          </h2>
        );
      case 'minimal':
        return (
          <h2 className="text-sm font-bold tracking-wide pb-1 mb-2 text-slate-900 border-b border-slate-200">
            {title}
          </h2>
        );
      case 'bold-underline':
      default:
        return (
          <h2 className="text-sm font-bold uppercase tracking-wider pb-1 mb-3 border-b-2" style={{ borderColor: accentColor, color: '#0f172a' }}>
            {title}
          </h2>
        );
    }
  };

  // Helper to render description bullet points
  const renderDescriptionBullets = (desc) => {
    if (!desc) return null;
    const lines = typeof desc === 'string' ? desc.split('\n').filter(l => l.trim() !== '') : [];
    if (lines.length === 0) return null;

    if (lines.length === 1 && !lines[0].startsWith('-')) {
      return <p className="text-xs text-slate-700 leading-relaxed mt-1">{desc}</p>;
    }

    return (
      <ul className="list-disc pl-4 space-y-1 mt-1.5">
        {lines.map((line, idx) => (
          <li key={idx} className="text-xs text-slate-700 leading-relaxed">
            {line.replace(/^-\s*/, '').trim()}
          </li>
        ))}
      </ul>
    );
  };

  // Render individual sections
  const renderSection = (secName) => {
    switch (secName) {
      case 'summary':
        if (!summary && !personalInfo.projectSummary) return null;
        return (
          <div key="summary" className="mb-6">
            {renderSectionHeader(layoutType === 'Executive' ? 'Executive Profile' : 'Professional Summary')}
            {summary && <p className="text-xs text-slate-700 leading-relaxed">{summary}</p>}
            {personalInfo.projectSummary && (
              <p className="text-xs text-slate-700 leading-relaxed mt-2 italic">{personalInfo.projectSummary}</p>
            )}
          </div>
        );

      case 'experience':
        if (!experience || experience.length === 0) return null;
        return (
          <div key="experience" className="mb-6">
            {renderSectionHeader('Work Experience')}
            <div className="space-y-4">
              {experience.map((exp, idx) => (
                <div key={exp.id || idx}>
                  <div className="flex flex-wrap justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">
                      {exp.role || 'Role'} <span className="font-normal text-slate-600">at {exp.company || 'Company'}</span>
                    </h3>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {exp.startDate} – {exp.endDate || 'Present'}
                    </span>
                  </div>
                  {renderDescriptionBullets(exp.description)}
                </div>
              ))}
            </div>
          </div>
        );

      case 'projects':
        if (!projects || projects.length === 0) return null;
        return (
          <div key="projects" className="mb-6">
            {renderSectionHeader('Key Projects')}
            <div className="space-y-3">
              {projects.map((proj, idx) => (
                <div key={proj.id || idx}>
                  <div className="flex flex-wrap justify-between items-baseline">
                    <h3 className="text-xs font-bold text-slate-900">
                      {proj.title || 'Project Name'}
                      {proj.role && <span className="font-normal text-slate-600"> | {proj.role}</span>}
                    </h3>
                    <div className="flex items-center gap-2">
                      {proj.technologies && (
                        <span className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {proj.technologies}
                        </span>
                      )}
                      {proj.github && (
                        <a href={proj.github} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">
                          [GitHub]
                        </a>
                      )}
                      {proj.live && (
                        <a href={proj.live} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-600 hover:underline">
                          [Live]
                        </a>
                      )}
                    </div>
                  </div>
                  {renderDescriptionBullets(proj.description)}
                </div>
              ))}
            </div>
          </div>
        );

      case 'education':
        if (!education || education.length === 0) return null;
        return (
          <div key="education" className="mb-6">
            {renderSectionHeader('Education')}
            <div className="space-y-3">
              {education.map((edu, idx) => (
                <div key={edu.id || idx} className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{edu.degree || 'Degree'}</h3>
                    <p className="text-xs text-slate-600">{edu.institution || 'University'}</p>
                    {edu.scoreValue && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {edu.scoreType === 'percentage' ? 'Percentage' : 'CGPA'}: <span className="font-semibold">{edu.scoreValue}</span>
                      </p>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {edu.startDate} – {edu.endDate || 'Completed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        if (!skills || skills.length === 0) return null;
        return (
          <div key="skills" className="mb-6">
            {renderSectionHeader('Core Skills & Competencies')}
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs font-medium rounded border"
                  style={{
                    backgroundColor: layoutType === 'Minimal' ? 'transparent' : '#f8fafc',
                    borderColor: layoutType === 'Minimal' ? '#e2e8f0' : accentColor + '33',
                    color: '#1e293b'
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        );

      case 'certifications':
        if (!certifications || certifications.length === 0) return null;
        return (
          <div key="certifications" className="mb-6">
            {renderSectionHeader('Certifications')}
            <ul className="list-disc pl-4 space-y-1">
              {certifications.map((cert, idx) => (
                <li key={idx} className="text-xs text-slate-700 leading-relaxed">
                  {cert}
                </li>
              ))}
            </ul>
          </div>
        );

      case 'languages':
        if (!languages || languages.length === 0) return null;
        return (
          <div key="languages" className="mb-6">
            {renderSectionHeader('Languages')}
            <div className="flex flex-wrap gap-2 text-xs text-slate-700">
              {languages.map((lang, idx) => (
                <span key={idx} className="px-2 py-0.5 bg-slate-100 rounded font-medium">
                  {lang}
                </span>
              ))}
            </div>
          </div>
        );

      case 'links':
        if (!links || links.length === 0) return null;
        return (
          <div key="links" className="mb-6">
            {renderSectionHeader('External Links')}
            <div className="flex flex-wrap gap-3 text-xs">
              {links.map((linkItem, idx) => {
                const label = typeof linkItem === 'string' ? linkItem : linkItem.label || linkItem.url;
                const url = typeof linkItem === 'string' ? linkItem : linkItem.url;
                return (
                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline font-medium" style={{ color: accentColor }}>
                    <Link2 className="w-3.5 h-3.5" />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`bg-white text-slate-900 p-8 sm:p-12 shadow-sm border border-slate-100 max-w-[210mm] min-h-[297mm] mx-auto ${getFontClass()} relative`}>
      {/* Document Header */}
      <div className={`pb-5 mb-6 ${layoutType === 'ATS Optimized' || layoutType === 'Minimal' ? 'text-left border-b border-slate-300' : 'text-center border-b-2'}`} style={{ borderColor: layoutType === 'ATS Optimized' ? '#cbd5e1' : accentColor }}>
        <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-wide text-slate-950">
          {personalInfo.name || 'Your Full Name'}
        </h1>
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest mt-1" style={{ color: accentColor }}>
          {personalInfo.title || 'Professional Title'}
        </p>

        {/* Contact info bar */}
        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 mt-3 ${layoutType === 'ATS Optimized' || layoutType === 'Minimal' ? 'justify-start' : 'justify-center'}`}>
          {personalInfo.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {personalInfo.email}
            </span>
          )}
          {personalInfo.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo.website && (
            <a href={personalInfo.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: accentColor }}>
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {personalInfo.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {personalInfo.linkedin && (
            <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: accentColor }}>
              <Link2 className="w-3.5 h-3.5 text-slate-400" />
              LinkedIn Profile
            </a>
          )}
          {personalInfo.address && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {personalInfo.address}
            </span>
          )}
          {personalInfo.github && (
            <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: accentColor }}>
              <Code className="w-3.5 h-3.5 text-slate-400" />
              GitHub Profile
            </a>
          )}
        </div>
      </div>

      {/* Document Body: Single Column vs Two Column */}
      {isTwoColumn ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column (2/3 width) */}
          <div className="md:col-span-2 space-y-2">
            {sectionOrder.filter(sec => ['summary', 'experience', 'projects', 'education'].includes(sec)).map(sec => renderSection(sec))}
          </div>
          {/* Sidebar (1/3 width) */}
          <div className="space-y-2 md:pl-6 md:border-l border-slate-200">
            {sectionOrder.filter(sec => ['skills', 'certifications', 'languages', 'links'].includes(sec)).map(sec => renderSection(sec))}
          </div>
        </div>
      ) : (
        /* Single Column Layout */
        <div className="space-y-2">
          {sectionOrder.map(sec => renderSection(sec))}
        </div>
      )}
    </div>
  );
};
