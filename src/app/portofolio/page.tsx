'use client';

import Layout from '@/app/portofolio/layout';
import { motion } from 'framer-motion';
import { Briefcase } from 'lucide-react';

const Home: React.FC = () => {
  return (
    <Layout>
      {/* Header dengan Gambar Profil */}
      <header className="relative bg-blue-500 p-8 text-center flex flex-col items-center">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white mb-4">
          {/* Ganti src dengan URL gambar profil Anda */}
          {/* <img src="https://via.placeholder.com/150" alt="Profile Picture" className="w-full h-full object-cover" /> */}
        </div>
        <h1 className="text-4xl font-bold">Herlambang Wicaksono</h1>
        <p className="text-md mt-2">Freelancer | Operating Room Nurse</p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 space-y-16"
      >
        {/* About Me Section */}
        <section id="bio" className="bg-blue-100 text-blue-900 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-2xl font-semibold">About Me</h2>
          <p className="text-lg">
            Hi! I&apos;m Herlambang Wicaksono, born on August 4th, 1994, a graduate of Respati University Yogyakarta. Previously worked at RS Carolus, currently working as a freelancer.
          </p>
          <p className="text-lg">
            I specialize in operating room nursing and room nursing. I am known for being adaptable and having a creative mind. My goal is to continuously improve my skills and explore new opportunities to excel in my field.
          </p>
        </section>

        {/* Experience Section */}
        <section id="experience" className="bg-blue-300 p-6 rounded-lg shadow-md text-white space-y-6">
          <h2 className="text-2xl font-semibold">Experience</h2>
          <div className="flex space-x-4">
            <Briefcase className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-xl font-bold">Freelancer</h3>
              <p className="text-sm">2019 - Present</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <Briefcase className="w-8 h-8 text-white" />
            <div>
              <h3 className="text-xl font-bold">RS Carolus</h3>
              <p className="text-sm">2018 - 2019</p>
            </div>
          </div>
        </section>
      </motion.div>
    </Layout>
  );
};

export default Home;
