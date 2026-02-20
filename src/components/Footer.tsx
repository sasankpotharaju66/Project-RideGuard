import logo from "@/assets/logo.jpeg";

const footerLinks = {
  Company: ["About Us", "Careers", "Blog", "Press"],
  Product: ["Bike Taxi", "Auto", "Cab", "Outstation"],
  Support: ["Help Center", "Safety", "Terms", "Privacy"],
  Cities: ["Bangalore", "Delhi", "Mumbai", "Hyderabad"],
};

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <a href="/" className="flex items-center gap-2">
              <img src={logo} alt="RideGuard logo" className="h-10 w-10 rounded-md object-contain" />
              <span className="font-display text-2xl font-bold text-gradient">RideGuard</span>
            </a>
            <p className="text-secondary-foreground/60 text-sm mt-3">
              India's largest ride platform. Fast, affordable, and safe rides.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-semibold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-secondary-foreground/60 hover:text-primary transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-secondary-foreground/10 mt-12 pt-8 text-center">
          <p className="text-sm text-secondary-foreground/50">
            © 2026 RideGuard. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
