# Northwind Insights: onboarding journey brief

> **Fictional company, made up for this example.** Northwind Insights, its product, customers, plans and every number
> below are invented to demonstrate Blueprint Deck Kit. All metrics are **illustrative**, not real data.

## 1. Company and product

Northwind Insights sells a cloud analytics product for **retail chains with 5 to 500 stores**. It pulls sales from the
chain's point-of-sale (POS) system and stock and cost data from its ERP, and turns them into store performance
dashboards, stock alerts and a weekly digest. Most customers are regional grocery, fashion and DIY chains that have
no data team of their own.

Pricing is **per store per month**, in three plans: *Starter* (up to 20 stores, card payment), *Growth* (up to 150
stores, card or invoice) and *Enterprise* (annual contract, invoice only). Add-on modules: *Demand forecasting* and
*Staff planning*.

Most of the journey is **self-serve** (product and email). Three touchpoints are **human-led**: the success manager
call, the annual invoice / procurement path, and the quarterly business review.

## 2. Personas

| persona | role in the journey | goal | main pain |
|---|---|---|---|
| **Head of Operations** (buyer) | finds Northwind, starts or approves the trial, signs the contract | see which stores under-perform without waiting for month-end reports | "I can't tell if it's worth it until our own data is in" |
| **Analyst** (user) | often signs up first (illustrative: ~60% of trials), builds the dashboards, invites colleagues | stop exporting POS reports to spreadsheets every Monday | trial looks empty until data is connected |
| **IT admin** (connects data) | invited during the trial to connect the POS and ERP | connect safely, read-only, without a project | asked by someone else, at short notice, with unclear scope |

## 3. Journey stages and touchpoints

**1 · Discover.** *Website* (product pages and retail case studies) and the *pricing page* with a per-store
calculator. Pain: visitors can't tell what "per store" costs for their chain; the calculator is the most visited page
after the home page. Metric (illustrative): 2.8% of pricing-page visitors start a trial.

**2 · Start a trial.** *Trial signup*: 14 days, work email, no card, about two minutes. *Onboarding emails* start at
signup (day 0, 2, 5 and 10), sent through the email provider, each pointing back to the next unfinished checklist
step. Pain: emails to the analyst don't reach the buyer. Metric (illustrative): 41% open rate, 9% click rate.

**3 · Connect data.** The trial first shows *sample store data* (a demo chain) so it is never empty. Connecting real
data usually needs the *IT admin*: the app has an "invite your IT admin" step that sends a setup link with the exact
read-only permissions needed. *Data connectors* exist for the common POS systems and ERPs; a CSV upload is the
fallback. Pain: this is where trials stall; the IT admin is not expecting the request. Metric (illustrative): median
4.2 days from IT invite to first connected store; 38% of trials never connect real data.

**4 · First dashboard.** The *in-app checklist* has five steps (connect data, pick stores, open the store performance
dashboard, set a stock alert, invite a colleague). The *first dashboard* is a store performance template filled with
the chain's own data. This is the activation moment. Pain: with sample data only, the dashboard doesn't answer the
buyer's question. Metric (illustrative): trials that reach their first dashboard with real data convert 3× as often.

**5 · Invite the team.** *Team invite* with viewer and analyst roles; every member gets the weekly digest email.
Trials with 10 or more stores are offered a 30-minute *success manager call* (human-led) to review the first
dashboard with the Head of Operations. Pain: single-user trials rarely convert. Metric (illustrative): trials with 3+
members convert at 2.5× the rate of single-user trials; 55% of offered calls are booked.

**6 · Go paid.** *Plans & billing* in the app: pick a plan and pay by card through the payment provider (Starter,
Growth). *Annual invoice* for Growth and Enterprise customers who buy through procurement (human-led: security
questionnaire, order form, invoice issued through the payment provider). Pain: procurement adds weeks and the trial
expires meanwhile. Metric (illustrative): trial-to-paid 18% overall; median 26 days for the invoice path.

**7 · Expand.** *Add stores* from the billing page as the chain rolls out to more locations; *add-on modules*
(forecasting, staff planning) unlocked in the app; a *quarterly business review* with the success manager for
Growth and Enterprise customers (human-led). Pain: expansion depends on the success manager's capacity. Metric
(illustrative): net revenue retention 112%; 30% of paying customers add stores within 12 months.

## 4. External parties

- **The customer's POS system** (customer-owned): hourly sales per store and product. Read-only connector.
- **The customer's ERP** (customer-owned): stock levels, purchasing and costs. Read-only connector or CSV export.
- **Payment provider** (third party): card payments, subscriptions and invoices for all plans.
- **Email provider** (third party): delivers onboarding emails, IT-admin setup links and the weekly digest.

## 5. What the onboarding team wants to show

The journey on one page for the next quarterly planning, with the personas' paths, the pain at each stage, and the
numbers to watch. The team's own priority: shorten the time from IT invite to first connected store.
