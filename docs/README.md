# XianFeast Documentation

This directory contains comprehensive documentation for the XianFeast Customer Ordering System.

## Documentation Overview

### User Documentation
- **[Customer User Guide](./customer-user-guide.md)** - Complete guide for customers using the ordering system
  - Account creation and authentication
  - Browsing stalls and products
  - Placing and tracking orders
  - Troubleshooting common issues

### Technical Documentation
- **[Technical Documentation](./technical-documentation.md)** - Comprehensive technical reference
  - API endpoints and data models
  - System architecture
  - Integration points
  - Security considerations
  - Performance optimization

### Operations Documentation
- **[Deployment Checklist](./deployment-checklist.md)** - Complete deployment procedures
  - Pre-deployment requirements
  - Step-by-step deployment process
  - Post-deployment verification
  - Rollback procedures

- **[Disaster Recovery Plan](./disaster-recovery-plan.md)** - Business continuity procedures
  - Recovery objectives and priorities
  - Backup and restore procedures
  - Disaster scenarios and responses
  - Communication plans

## Quick Start Guides

### For Developers
1. Read the [Technical Documentation](./technical-documentation.md) for system overview
2. Review API endpoints and data models
3. Set up development environment using deployment scripts
4. Run test suites to verify functionality

### For Operations Teams
1. Review the [Deployment Checklist](./deployment-checklist.md)
2. Set up monitoring and backup systems
3. Test disaster recovery procedures
4. Configure alerting and escalation

### For Customer Support
1. Study the [Customer User Guide](./customer-user-guide.md)
2. Familiarize yourself with troubleshooting procedures
3. Understand the order flow and status tracking
4. Learn about authentication and account management

## System Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer UI   │    │   Business UI   │    │   Admin UI      │
│   (React/Next)  │    │   (React/Next)  │    │   (React/Next)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     API Layer (Next.js)   │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Service Layer        │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │     Data Layer           │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │       DynamoDB           │
                    └─────────────────────────────┘
```

## Key Features

### Customer Features
- **Magic Link Authentication** - Secure, passwordless signup and login
- **Stall Discovery** - Browse and filter food stalls by cuisine, price, hours
- **Order Management** - Place, track, and manage meal orders
- **Cart Persistence** - Shopping cart saved across sessions
- **Real-time Updates** - Live order status tracking and notifications

### Business Features
- **Order Processing** - Manage incoming customer orders
- **Analytics Dashboard** - Track sales, popular items, customer trends
- **Stall Management** - Update menus, hours, and availability
- **Customer Communication** - Automated email notifications

### Admin Features
- **System Monitoring** - Health checks, performance metrics, error tracking
- **User Management** - Customer and business account administration
- **Analytics** - Platform-wide metrics and reporting
- **Configuration** - System settings and feature flags

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: DynamoDB (primary), Google Sheets (legacy)
- **Authentication**: JWT with Argon2 password hashing
- **Email**: Custom HTML templates with SMTP
- **Monitoring**: Custom performance monitoring and alerting
- **Deployment**: Docker, AWS, automated backup systems

## Security Features

- **Authentication**: Magic link + password authentication
- **Authorization**: Role-based access control (RBAC)
- **Data Protection**: Encryption at rest and in transit
- **Input Validation**: Comprehensive sanitization and validation
- **Rate Limiting**: API endpoint protection
- **Audit Logging**: Security event tracking

## Performance Characteristics

- **Response Time**: <500ms for API endpoints
- **Page Load**: <3 seconds for customer pages
- **Availability**: 99.9% uptime target
- **Scalability**: Horizontal scaling with load balancing
- **Caching**: Multi-layer caching strategy

## Support and Maintenance

### Regular Maintenance
- **Daily**: Automated backups, health checks, log monitoring
- **Weekly**: Performance analysis, security updates
- **Monthly**: Disaster recovery testing, capacity planning
- **Quarterly**: Full system review, documentation updates

### Monitoring and Alerting
- **System Health**: Uptime, response times, error rates
- **Business Metrics**: Order volume, customer signups, revenue
- **Security**: Failed logins, suspicious activity, vulnerabilities
- **Performance**: Database queries, memory usage, CPU utilization

### Backup and Recovery
- **Backup Schedule**: Daily, weekly, and monthly automated backups
- **Recovery Time**: 4 hours maximum (RTO)
- **Data Loss**: 1 hour maximum (RPO)
- **Testing**: Monthly backup restoration tests

## Getting Help

### For Technical Issues
- Check the troubleshooting sections in relevant documentation
- Review system logs and monitoring dashboards
- Contact the development team for code-related issues
- Escalate to operations team for infrastructure issues

### For Business Issues
- Review customer user guide for user-facing problems
- Check analytics dashboards for business metrics
- Contact customer success team for user experience issues
- Escalate to management for business impact assessment

### Emergency Contacts
- **Technical Emergency**: [Development Team Lead]
- **Operations Emergency**: [Operations Manager]
- **Business Emergency**: [Product Manager]
- **Security Emergency**: [Security Team Lead]

## Contributing to Documentation

### Documentation Standards
- Use clear, concise language
- Include code examples where appropriate
- Keep screenshots and diagrams current
- Test all procedures before documenting
- Review and update quarterly

### Update Process
1. Create documentation updates in feature branches
2. Review changes with relevant stakeholders
3. Test procedures in staging environment
4. Update version numbers and dates
5. Deploy to production documentation

---

*This documentation is maintained by the XianFeast development team and updated with each major release.*

*Last Updated: [Current Date]*
*Version: 1.0*