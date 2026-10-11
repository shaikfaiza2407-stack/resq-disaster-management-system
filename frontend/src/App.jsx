
import { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

const API = 'http://localhost:5000/api/disasters'

const guides = {
  flood: {
    title: 'Flood Safety',
    icon: '〰',
    intro: 'Stay alert, avoid floodwater, and move to safer ground.',
    dos: [
      'Move to higher ground if flooding approaches.',
      'Follow official alerts and evacuation instructions.',
      'Keep drinking water, medicines, a torch, and important documents ready.',
      'Switch off electricity only if it is safe.',
    ],
    donts: [
      'Never walk or drive through floodwater.',
      'Do not touch electrical equipment while standing in water.',
      'Avoid potentially contaminated floodwater.',
      'Never ignore evacuation instructions.',
    ],
  },
  cyclone: {
    title: 'Cyclone Safety',
    icon: '🌀',
    intro: 'Prepare for strong winds, debris, and flooding.',
    dos: [
      'Monitor official weather alerts.',
      'Secure loose objects and stay inside a sturdy building.',
      'Keep water, food, medicines, and charged phones ready.',
      'Move to an authorised shelter if instructed.',
    ],
    donts: [
      'Do not go outside during strong winds.',
      'Stay away from windows and damaged power lines.',
      'Do not spread unverified warnings.',
      'Do not return to evacuated areas until authorities permit it.',
    ],
  },
  kit: {
    title: 'Emergency Kit',
    icon: '✚',
    intro: 'Keep essential supplies together and ready for emergencies.',
    dos: [
      'Pack drinking water and non-perishable food.',
      'Include a first-aid kit, medicines, torch, batteries, and power bank.',
      'Keep important documents in a waterproof pouch.',
      'Check expiry dates and replace supplies regularly.',
    ],
    donts: [
      'Do not store medicines in hot or damp places.',
      'Do not depend on a single phone for information.',
      'Do not forget essential supplies for children or older adults.',
      'Avoid using candles near flammable materials.',
    ],
  },
}

function App() {
  const [page, setPage] = useState('home')
  const [guideKey, setGuideKey] = useState('flood')
  const [formData, setFormData] = useState({
    disasterType: '',
    location: '',
    severity: '',
    description: '',
  })
  const [reports, setReports] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const goTo = (nextPage) => {
    setPage(nextPage)
    setMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openGuide = (key) => {
    setGuideKey(key)
    goTo('guide')
  }

  const loadReports = async () => {
    setLoading(true)
    try {
      const response = await axios.get(API)
      setReports(response.data)
      setMessage('')
    } catch {
      setMessage('Unable to load reports. Check that the backend is running.')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (page === 'user' || page === 'supervisor') {
      loadReports()
    }
  }, [page])

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setMessage('')

    try {
      const response = await axios.post(API, formData)
      setMessage(response.data.message || 'Incident submitted successfully.')
      setMessageType('success')
      setFormData({
        disasterType: '',
        location: '',
        severity: '',
        description: '',
      })
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          'Unable to submit the report. Please check the backend.'
      )
      setMessageType('error')
    } finally {
      setSubmitting(false)
    }
  }

  const updateResponse = async (report) => {
    const status = document.getElementById(`status-${report._id}`).value
    const supervisorResponse = document
      .getElementById(`response-${report._id}`)
      .value

    if (!supervisorResponse.trim()) {
      window.alert('Please enter a response for the user.')
      return
    }

    try {
      await axios.patch(`${API}/${report._id}/response`, {
        status,
        supervisorResponse,
      })
      window.alert('Incident response updated successfully!')
      loadReports()
    } catch (error) {
      window.alert(
        error.response?.data?.message || 'Unable to update the incident.'
      )
    }
  }

  const ReportCard = ({ report, supervisor = false }) => (
    <article className="dashboard-card" key={report._id}>
      <div className="report-card-header">
        <div>
          <p className="report-type-label">INCIDENT REPORT</p>
          <h3>
            {report.disasterType} — {report.location}
          </h3>
        </div>
        <span
          className={`status-badge ${(report.status || 'Pending')
            .toLowerCase()
            .replace(' ', '-')}`}
        >
          {report.status || 'Pending'}
        </span>
      </div>

      <p><strong>Severity:</strong> {report.severity}</p>
      <p><strong>Description:</strong> {report.description}</p>
      <p className="report-date">
        Reported: {new Date(report.createdAt).toLocaleString()}
      </p>

      {supervisor ? (
        <div className="supervisor-editor">
          <label htmlFor={`status-${report._id}`}>Update status</label>
          <select
            id={`status-${report._id}`}
            defaultValue={report.status || 'Pending'}
          >
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          <label htmlFor={`response-${report._id}`}>
            Response to user
          </label>
          <textarea
            id={`response-${report._id}`}
            rows="3"
            defaultValue={report.supervisorResponse || ''}
            placeholder="Enter an update for the user..."
          />

          <button
            className="primary-button"
            onClick={() => updateResponse(report)}
          >
            Save Response
          </button>
        </div>
      ) : (
        <div className="supervisor-message">
          <h4>Supervisor Response</h4>
          <p>
            {report.supervisorResponse ||
              'No response yet. Your report is awaiting review.'}
          </p>
        </div>
      )}
    </article>
  )

  const guide = guides[guideKey]

  return (
    <div className="app">
      <nav className="navbar">
        <button
          className="brand"
          onClick={() => goTo('home')}
          aria-label="ResQ home"
        >
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-symbol">R</span>
            <span className="brand-q">Q</span>
          </span>
          <span className="brand-copy">
            <strong>ResQ</strong>
            <small>Disaster Management System</small>
          </span>
        </button>

        <div className="nav-links">
          <button
            className={page === 'home' ? 'active' : ''}
            onClick={() => goTo('home')}
          >
            Home
          </button>
          <button
            className={page === 'safety' || page === 'guide' ? 'active' : ''}
            onClick={() => goTo('safety')}
          >
            Safety Guides
          </button>
          <button
            className={page === 'about' ? 'active' : ''}
            onClick={() => goTo('about')}
          >
            About
          </button>
          <button
            className={page === 'contact' ? 'active' : ''}
            onClick={() => goTo('contact')}
          >
            Contact
          </button>
        </div>

        <div className="nav-actions">
          <button
            className="login-button user-login"
            onClick={() => goTo('user')}
          >
            <span aria-hidden="true">♟</span> User Login
          </button>
          <button
            className="login-button supervisor-login"
            onClick={() => goTo('supervisor')}
          >
            <span aria-hidden="true">⬟</span> Supervisor Login
          </button>
        </div>
      </nav>

      {page === 'home' && (
        <>
          <section className="hero">
            <div className="hero-shade" />
            <div className="hero-content">
              <p className="tagline">PREPARE · RESPOND · RECOVER</p>
              <h1>
                Together, We Can
                <br />
                Make <em>Communities Safer</em>
              </h1>
              <p className="hero-description">
                Report disasters, access safety information, and
                <br className="desktop-break" />
                build a more resilient tomorrow.
              </p>
              <button
                className="hero-button"
                onClick={() => goTo('report')}
              >
                <span aria-hidden="true">⚑</span>
                Report an Incident
                <span className="hero-arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          <section className="safety-section" id="safety">
            <div className="section-heading">
              <div>
                <h2>
                  Disaster <span>Safety Guides</span>
                </h2>
                <p className="section-description">
                  Learn essential safety tips, important do’s and don’ts,
                  and emergency helpline numbers.
                </p>
              </div>
            </div>

            <div className="guide-grid">
              <button
                className="guide-card flood-card"
                onClick={() => openGuide('flood')}
              >
                <span className="guide-icon flood-icon" aria-hidden="true">≋</span>
                <span className="guide-card-content">
                  <span className="guide-card-title">Flood Safety</span>
                  <span className="guide-card-description">
                    Stay aware, stay prepared, and move to safer ground
                    during floods.
                  </span>
                </span>
                <span className="guide-link">Learn More <span>→</span></span>
                <span className="card-arrow" aria-hidden="true">›</span>
              </button>

              <button
                className="guide-card cyclone-card"
                onClick={() => openGuide('cyclone')}
              >
                <span className="guide-icon cyclone-icon" aria-hidden="true">🌀</span>
                <span className="guide-card-content">
                  <span className="guide-card-title">Cyclone Safety</span>
                  <span className="guide-card-description">
                    Follow official alerts and take necessary precautions
                    during cyclones.
                  </span>
                </span>
                <span className="guide-link">Learn More <span>→</span></span>
                <span className="card-arrow" aria-hidden="true">›</span>
              </button>

              <button
                className="guide-card kit-card"
                onClick={() => openGuide('kit')}
              >
                <span className="guide-icon kit-icon" aria-hidden="true">✚</span>
                <span className="guide-card-content">
                  <span className="guide-card-title">Emergency Kit</span>
                  <span className="guide-card-description">
                    Keep essential supplies ready for unexpected emergencies.
                  </span>
                </span>
                <span className="guide-link">Learn More <span>→</span></span>
                <span className="card-arrow" aria-hidden="true">›</span>
              </button>
            </div>
          </section>
        </>
      )}

      {page === 'safety' && (
        <section className="page-section">
          <p className="eyebrow">BE INFORMED, BE PREPARED</p>
          <h1>Disaster Safety Guides</h1>
          <p className="page-intro">
            Choose a guide for practical do’s, don’ts, and emergency contacts.
          </p>

          <div className="guide-grid guide-grid-page">
            {Object.entries(guides).map(([key, item]) => (
              <button
                key={key}
                className={`guide-card ${
                  key === 'flood' ? 'flood-card' :
                  key === 'cyclone' ? 'cyclone-card' : 'kit-card'
                }`}
                onClick={() => openGuide(key)}
              >
                <span className="guide-icon">{item.icon}</span>
                <span className="guide-card-content">
                  <span className="guide-card-title">{item.title}</span>
                  <span className="guide-card-description">{item.intro}</span>
                </span>
                <span className="guide-link">Learn More →</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {page === 'guide' && (
        <section className="page-section guide-detail">
          <button className="back-link" onClick={() => goTo('safety')}>
            ← Back to Safety Guides
          </button>

          <div className="guide-detail-heading">
            <span className={`detail-icon ${guideKey}`}>{guide.icon}</span>
            <div>
              <p className="eyebrow">RESQ SAFETY GUIDE</p>
              <h1>{guide.title}</h1>
              <p className="page-intro">{guide.intro}</p>
            </div>
          </div>

          <div className="dos-donts-grid">
            <article className="advice-panel dos-panel">
              <h2><span>✓</span> Do’s</h2>
              <ul>
                {guide.dos.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>

            <article className="advice-panel donts-panel">
              <h2><span>×</span> Don’ts</h2>
              <ul>
                {guide.donts.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </article>
          </div>

          <aside className="helpline-panel">
            <div className="helpline-icon" aria-hidden="true">☎</div>
            <div>
              <h2>Emergency Helpline</h2>
              <p>India’s pan-India emergency response number</p>
            </div>
            <a href="tel:112" className="helpline-number">112</a>
          </aside>

          <p className="guide-note">
            In an emergency, follow instructions from local authorities and
            official disaster-management agencies.
          </p>
        </section>
      )}

      {page === 'about' && (
        <section className="page-section simple-page">
          <p className="eyebrow">ABOUT RESQ</p>
          <h1>Preparedness starts with information.</h1>
          <p className="page-intro">
            ResQ is a disaster-response and safety project designed to help
            people report incidents, review safety guidance, and follow report
            updates in one place.
          </p>

          <div className="about-points">
            <div><span>01</span><h3>Report</h3><p>Share incident details and the affected location.</p></div>
            <div><span>02</span><h3>Respond</h3><p>Review reports and communicate status updates.</p></div>
            <div><span>03</span><h3>Prepare</h3><p>Read practical safety guides before emergencies.</p></div>
          </div>
        </section>
      )}

      {page === 'contact' && (
        <section className="page-section simple-page">
          <p className="eyebrow">CONTACT &amp; EMERGENCY HELP</p>
          <h1>Need help?</h1>
          <p className="page-intro">
            For immediate emergencies in India, call{' '}
            <a className="inline-helpline" href="tel:112">112</a>. This project
            does not automatically dispatch rescue teams or notify emergency
            services.
          </p>

          <div className="contact-box">
            <span aria-hidden="true">☎</span>
            <div>
              <h2>Emergency response</h2>
              <p>
                Call 112 for pan-India emergency assistance. For local disaster
                instructions, follow official government alerts.
              </p>
            </div>
          </div>
          <button className="primary-button" onClick={() => goTo('report')}>
            Report an Incident →
          </button>
        </section>
      )}

      {page === 'report' && (
        <section className="page-section form-page">
          <p className="eyebrow">HELP YOUR COMMUNITY</p>
          <h1>Report an Incident</h1>
          <p className="page-intro">
            Share what happened and where help may be needed.
          </p>

          <form className="report-form" onSubmit={handleSubmit}>
            <label htmlFor="disasterType">Disaster Type</label>
            <select
              id="disasterType"
              name="disasterType"
              value={formData.disasterType}
              onChange={handleChange}
              required
            >
              <option value="">Select disaster type</option>
              <option value="Flood">Flood</option>
              <option value="Cyclone">Cyclone</option>
              <option value="Fire">Fire</option>
              <option value="Earthquake">Earthquake</option>
              <option value="Landslide">Landslide</option>
              <option value="Other">Other</option>
            </select>

            <label htmlFor="location">Location</label>
            <input
              id="location"
              name="location"
              placeholder="Enter affected location"
              value={formData.location}
              onChange={handleChange}
              required
            />

            <label htmlFor="severity">Severity</label>
            <select
              id="severity"
              name="severity"
              value={formData.severity}
              onChange={handleChange}
              required
            >
              <option value="">Select severity</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>

            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              placeholder="Describe what happened..."
              value={formData.description}
              onChange={handleChange}
              required
            />

            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Report →'}
            </button>

            {message && (
              <p className={`form-message ${messageType}`} role="status">
                {message}
              </p>
            )}
          </form>
        </section>
      )}

      {page === 'user' && (
        <section className="page-section dashboard-page">
          <p className="eyebrow">YOUR ACTIVITY</p>
          <h1>User Dashboard</h1>
          <p className="page-intro">
            View incident reports and supervisor updates.
          </p>

          <button className="secondary-button refresh-button" onClick={loadReports}>
            ↻ Refresh Reports
          </button>

          {message && <p className={`form-message ${messageType}`} role="status">{message}</p>}

          {loading ? (
            <p className="empty-state">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="empty-state">No disaster reports found.</p>
          ) : (
            <div className="dashboard-grid">
              {reports.map((report) => (
                <ReportCard key={report._id} report={report} />
              ))}
            </div>
          )}
        </section>
      )}

      {page === 'supervisor' && (
        <section className="page-section dashboard-page">
          <p className="eyebrow">INCIDENT OVERVIEW</p>
          <h1>Supervisor Dashboard</h1>
          <p className="page-intro">
            Review incident reports and provide status updates.
          </p>

          <div className="dashboard-stats">
            <div className="stat-card"><h3>{reports.length}</h3><p>Total Reports</p></div>
            <div className="stat-card"><h3>{reports.filter((r) => r.status === 'Pending').length}</h3><p>Pending</p></div>
            <div className="stat-card"><h3>{reports.filter((r) => r.status === 'In Progress').length}</h3><p>In Progress</p></div>
            <div className="stat-card"><h3>{reports.filter((r) => r.status === 'Resolved').length}</h3><p>Resolved</p></div>
          </div>

          <button className="secondary-button refresh-button" onClick={loadReports}>
            ↻ Refresh Reports
          </button>

          {message && <p className={`form-message ${messageType}`} role="status">{message}</p>}

          {loading ? (
            <p className="empty-state">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="empty-state">No disaster reports found.</p>
          ) : (
            <div className="dashboard-grid">
              {reports.map((report) => (
                <ReportCard key={report._id} report={report} supervisor />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default App
