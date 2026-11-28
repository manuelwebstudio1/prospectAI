update public.subscription_plans
set
  price_monthly_ghs = 50,
  price_annual_ghs = 500
where slug = 'starter';

update public.subscription_plans
set
  price_monthly_ghs = 150,
  price_annual_ghs = 1500
where slug = 'professional';

update public.subscription_plans
set
  price_monthly_ghs = 350,
  price_annual_ghs = 3500
where slug = 'agency';
