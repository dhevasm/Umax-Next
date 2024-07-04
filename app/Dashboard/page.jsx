'use client'

import axios from "axios"
import { useState, useEffect, useRef, createContext, useMemo, use } from "react"

// Components
import Navbar from "@/components/Navbar"
import Sidebar from "@/components/Sidebar"

// Dashboard Content
import Performance from "@/components/Dashboard-content/Performance"
import Metrics from "@/components/Dashboard-content/Metrics"
import History from "@/components/Dashboard-content/History"
import Setting from "@/components/Dashboard-content/Setting"

export const SidebarContext = createContext()
// export const campaignIDContext = createContext()

export default function Dashboard() {

    // expanse card start
    const Card = useRef(null)
    const [campaignID, setCampaignID] = useState('');
    const [SidebarHide, setSidebarHide] = useState(false)
    const sidebarContext = (() => ({
        SidebarHide,
        setSidebarHide,
        campaignID,
        setCampaignID,
    }), [SidebarHide, setSidebarHide])

    useEffect(() => {
        if (SidebarHide) {
            Card.current.classList.add("w-full")
        } else {
            Card.current.classList.remove("w-full")
        }
    }, [SidebarHide])
    // expnase card end

    const handleCampaignIDChange = (id) => {
        setCampaignID(id);
    };

    // Dashborad Change Content Start
    const [activeContent, setActiveContent] = useState("performance")
    // Dashborad Change Content End

    // Dashboard Link active start
    function SetActiveLink(Link){
        document.querySelector(".dashboardActive").classList?.remove("dashboardActive");
        document.getElementById(Link).classList?.add("dashboardActive");
        setActiveContent(Link)
    }
    // Dashboard Link active end

    return (
        <>
        {/* Header */}
        
        <SidebarContext.Provider value={sidebarContext}>
            <Navbar />
            <Sidebar onCampaignIDChange={handleCampaignIDChange}r/>
        </SidebarContext.Provider>

        {/* Dashboard Container */}
        <div className="flex w-full min-h-full justify-end items-center bg-gray-100">
            {/* Dashboard Card */}
            <div className="w-[75%] min-h-screen bg-white rounded-xl mt-20 me-3 ms-5 text-black transition-transform" ref={Card}>
                {/* header */}
                <div className="m-10">
                    <h1 className="text-2xl">Title</h1>

                    {/* Dashboard Nav Link */}
                    <div className="md:flex hidden gap-7 mt-5 border-b-2 border-gray-300">
                        <style jsx>
                            {
                                `
                                .dashboardActive{
                                    color : blue;
                                    padding-bottom: 10px;
                                    border-bottom: 3px solid blue;
                                }
                                .DashboardLink:hover{
                                    cursor:pointer;
                                }
                                `
                            }
                        </style>
                        <p className="dashboardActive DashboardLink" id="performance" onClick={() => SetActiveLink("performance")}>Performance</p>
                        <p className="DashboardLink" id="metrics" onClick={() => SetActiveLink("metrics")}>Metrics</p>
                        <p className="DashboardLink" id="history" onClick={() => SetActiveLink("history")}>History</p>
                        <p className="DashboardLink" id="setting" onClick={() => SetActiveLink("setting")}>Setting</p>
                    </div>
                </div>

                {/* Nav Select */}
                <div className="flex md:hidden justify-end m-10">
                    <select className="border w-full border-gray-300 rounded-md shadow-sm p-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" onChange={(e) => SetActiveLink(e.target.value)}>
                        <option value="performance">Performance</option>
                        <option value="metrics">Metrics</option>
                        <option value="history">History</option>
                        <option value="setting">Setting</option>
                    </select>
                </div>

                {/* Content */}
                <div className="m-10">
                    {activeContent === "performance" && <Performance id={campaignID}/>}
                    {activeContent === "metrics" && <Metrics/>}
                    {activeContent === "history" && <History/>}
                    {activeContent === "setting" && <Setting/>}
                </div>
            </div>
        </div>
        </>
    )
}

