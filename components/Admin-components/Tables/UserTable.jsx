'use client'

import axios from "axios"
import { useState,useEffect, useRef, useContext } from "react"
import { AdminDashboardContext } from "@/app/[locale]/admin-dashboard/page"
import Swal from "sweetalert2"
import { useDownloadExcel } from "react-export-table-to-excel"
import jsPDF from "jspdf"
import 'jspdf-autotable'
import { IconContext } from "react-icons"
import { AiOutlineFilePdf } from "react-icons/ai"
import { FaArrowAltCircleDown, FaArrowDown, FaTable } from "react-icons/fa"
import { FaTrash } from "react-icons/fa"
import { FaTimes } from "react-icons/fa"
import { useRouter } from "next/navigation"
import { RiFileExcel2Line, RiUser3Line } from "react-icons/ri"
import CountCard from "../CountCard"
import { BiPlus } from "react-icons/bi"
import { useTranslations } from "next-intl"
import toastr from 'toastr';
import 'toastr/build/toastr.min.css';

export default function UserTable() {

    const [users, setUsers] = useState([])
    const [userMemo, setUserMemo] = useState([])
    const [EditUserId, setEditUserId] = useState(null)
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedTenant, setSelectedTenant] = useState("");
    const [searchTerm, setSearchTerm] = useState("")
    const [currentPage, setCurrentPage] = useState(1);
    const [dataPerPage, setDataPerPage] = useState(10);
    const [isLoading, setIsLoading] = useState(true);
    const t = useTranslations('admin-users')
    const tfile = useTranslations('swal-file')
    const tdel = useTranslations("swal-delete")

    const {sidebarHide, setSidebarHide, updateCard, setUpdateCard, changeTable, setChangeTable, userData, dataDashboard} = useContext(AdminDashboardContext)

    const addModal = useRef(null)
    const [modeModal, setModeModal] = useState("add")

    const Router = useRouter()

    function showModal(mode, user_id = null ){
        document.body.style.overflow = 'hidden'
        // console.log(user_id)
        setModeModal(mode)
        if(mode == "Edit"){
            const filteredUsers = userMemo.filter(user => user._id === user_id);
            if(filteredUsers.length > 0){
                // console.log(filteredUsers[0])
                setEditUserId(user_id)
                document.getElementById('name').value = filteredUsers[0].name
                document.getElementById('role').value = filteredUsers[0].roles
                
            } else{
                Swal.fire("User not found");
            }
        }
        // else if(mode == "Create") {
        //     document.getElementById('name').value = null
        //     document.getElementById('role').value = null
        // }
        addModal.current.classList.remove("hidden")
    }
    function closeModal(){
        document.body.style.overflow = 'auto'
        addModal.current.classList.add("hidden")
    }
    
    function handleDelete(user_id){
        Swal.fire({
            title: tdel('warn'),
            text: tdel('msg'),
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: tdel('yes'),
            cancelButtonText: tdel('no'),
          }).then((result) => {
            if (result.isConfirmed) {
            deleteuser(user_id)
            // Swal.fire({
            //     title: tdel('success'),
            //     text: tdel('suc-msg'),
            //     icon: "success"
            // })
            toastr.success('User Deleted', 'Success')
            setTimeout(() => {
                closeModal()
            }, 100);
            }
          });
    }

    const deleteuser = async (user_id) => {
        closeModal()
        // console.log(user_id)
        try {
            const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/user-delete?user_id=${user_id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                }
            })
            getUsers()
            setUpdateCard(true)
        } catch (error) {
            console.log(error)
        }
    }

    const tableRef = useRef(null);

    function generateExcel(){
        Swal.fire({
            title: `${tfile('warn')}`,
            text: `${tfile('msg2')}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: `${tfile('yes')}`,
            cancelButtonText: `${tfile('no')}`,
          }).then((result) => {
            if (result.isConfirmed) {
                onDownload();
            //   Swal.fire({
            //     title: `${tfile('success')}`,
            //     text: `${tfile('success')}`,
            //     icon: "success"
            //   });
            toastr.success(`${tfile('success')}`, `${tfile('success')}`)
            }
          });
    }

    const { onDownload } = useDownloadExcel({
        currentTableRef: tableRef.current,
        filename: "DataUsers",
        sheet: "DataUsers",
    });

    const generatePDF = () => {
        Swal.fire({
            title: `${tfile('warn')}`,
            text: `${tfile('msg1')}`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: `${tfile('yes')}`,
            cancelButtonText: `${tfile('no')}`,
          }).then((result) => {
            if (result.isConfirmed) {
                const doc = new jsPDF();
                doc.text('Data Users Umax Dashboard', 10, 10);
                doc.autoTable({
                    head: [['Name', 'Role', 'Email', "Company"]],
                    body: users.map((user) => [user.name, user.roles, user.email, user.company_name]),
                });
                doc.save('DataUsers.pdf');
            //   Swal.fire({
            //     title: `${tfile('success')}`,
            //     text: `${tfile('suc-msg')}`,
            //     icon: "success"
            //   });
            toastr.success(`${tfile('success')}`, `${tfile('suc-msg')}`)
            }
          });
       
    };

    function handleDetail(user_id){
        const filteredUsers = users.filter(user => user._id === user_id);
        if(filteredUsers.length > 0) {
            const [user] = filteredUsers;
            Swal.fire({
                title: `${user.name} (${user.roles})`,
                text: `${user.email} | ${user.company_name}`,
                imageUrl: `data:image/png;base64, ${user.image}`,
                imageWidth: 200,
                imageHeight: 200,
                imageAlt: "Photo Profile"
              });
        } else {
            Swal.fire("User not found");
        }
    }

    async function getUsers(){
        setIsLoading(true)
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/user-by-tenant`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
            }
        })
        setUsers(response.data.Data)
        setUserMemo(response.data.Data)
        setIsLoading(false)
    }

    useEffect(() => {
        getUsers()
    }, [])

    // async function creatUser(){
    //     const name = document.getElementById('name').value
    //     const email = document.getElementById('email').value
    //     const language = document.getElementById('language').value
    //     const culture = document.getElementById('culture').value
    //     const currency = document.getElementById('currency').value
    //     const timezone = document.getElementById('input_timezone').value
    //     const currencyposition = document.getElementById('currencyposition').value

    //     const formData = new FormData();
    //     formData.append('name', name);
    //     formData.append('email', email);
    //     formData.append('language', language);
    //     formData.append('culture', culture);
    //     formData.append('currency', currency);
    //     formData.append('input_timezone', timezone);
    //     formData.append('currency_position', currencyposition);

    //     const response = await axios.post('https://umaxxxxx-1-r8435045.deta.app/user-create', formData, {
    //         headers: {
    //             Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
    //         }
    //     })

    //     if(response.data.Output == "Registration Successfully"){
    //         getUsers()
    //         closeModal()
    //         setUpdateCard(true)
    //         document.getElementById('name').value = null
    //         document.getElementById('email').value = null
    //         Swal.fire("Success", "user created successfully", "success")
    //     }else{
    //         Swal.fire("Error", response.detail, "error")
    //     }
    // }

    async function updateUser(){
        if(EditUserId !== null) {
            const role = document.getElementById('role').value
            const formData = new FormData();
            formData.append('role', role);
            console.log(EditUserId)
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/change-user-role?user_id=${EditUserId}`, formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                }
            })
    
            if(response.data.Output.includes("Successfully changed") || response.data.Output.includes("Berhasil")){
                getUsers()
                closeModal()
                // Swal.fire("Success", "user Updated", "success")
                toastr.success('User Updated', 'Success')
            }else{
                // Swal.fire("Error", response.detail.ErrMsg, "error")
                toastr.error(response.detail.ErrMsg, 'Error')
            }
        }
    }


    const [timezone, setTimezone] = useState([])
    const [currency, setCurrency] = useState([])
    const [culture, setCulture] = useState([])
    const [tenants, setTenants] = useState([])

    async function getSelectFrontend(){
        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/timezone`).then((response) => {
            setTimezone(response.data)
        })

        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/currency`).then((response) => {
            setCurrency(response.data)
        })

        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/culture`).then((response) => {
            setCulture(response.data)
        })

        if(localStorage.getItem('roles') == 'sadmin'){
            await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/tenant-get-all`, {
                headers : {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                }
            }).then((response) => {
                setTenants(response.data.Data)
            })
        }
    }

    useEffect(() => {
        getSelectFrontend()
    }, [])

    function LoadingCircle() {
        return (
          <div className="flex justify-center items-center h-20">
            <div className="relative">
              <div className="w-10 h-10 border-4 border-[#1C2434] dark:border-white rounded-full border-t-transparent dark:border-t-transparent animate-spin"></div>
            </div>
          </div>
        );
    };

    // Filter Function
    const handleRoleChange = (event) => {
        setSelectedRole(event.target.value);
        setCurrentPage(1);
    };

    const handleTenantChange = (event) => {
        setSelectedTenant(event.target.value);
        setCurrentPage(1);
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
        setCurrentPage(1);
    };

    const filteredData = users.filter((data) => {
        const client_name = localStorage.getItem("name");
        const role = localStorage.getItem("roles");
        // if(role != 'client') {
        return (
            (!selectedRole || data.roles === selectedRole) &&
            (!selectedTenant || data.tenant_id.toLowerCase() == selectedTenant.toLowerCase()) &&
            (!searchTerm ||
                data.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
        // } else {
        //     return (
        //         (!selectedPlatform || data.platform === Number(selectedPlatform)) &&
        //         (!selectedObjective || data.objective === Number(selectedObjective)) &&
        //         (!searchTerm ||
        //             data.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        //         (data.client_name.toLowerCase() == client_name.toLowerCase())
        //     );
        // }
    });
    // Filter function end

    // Calculate total number of pages
    const totalPages = Math.ceil(filteredData.length / dataPerPage);

    // Function to change current page
    const goToPage = (page) => {
        setCurrentPage(page);
    };

    const renderPagination = () => {
        const pageButtons = [];
        const maxButtons = 3; // Maximum number of buttons to show
    
        // First page button
        pageButtons.push(
            <button
                key="first"
                className={`px-1 sm:px-3 md:px-3 lg:px-3 xl:px-3 py-1 dark:text-white ${
                    currentPage === 1 ? "cursor-not-allowed" : ""
                } rounded-md`}
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
            >
                {'<<'}
            </button>
        );
    
        // Previous page button
        pageButtons.push(
            <button
                key="prev"
                className={`px-1 sm:px-3 md:px-3 lg:px-3 xl:px-3 py-1 dark:text-white ${
                    currentPage === 1 ? "cursor-not-allowed" : ""
                } rounded-md`}
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
            >
                {'<'}
            </button>
        );
    
        // Info page
        pageButtons.push(
            <span key="info" className="px-1 sm:px-3 md:px-3 lg:px-3 xl:px-3 py-1 dark:text-white rounded-md">
                {`${t('page')} ${currentPage} / ${totalPages}`}
            </span>
        );
    
        // Next page button
        pageButtons.push(
            <button
                key="next"
                className={`px-1 sm:px-3 md:px-3 lg:px-3 xl:px-3 py-1 dark:text-white ${
                    currentPage === totalPages ? "cursor-not-allowed" : ""
                } rounded-md`}
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
            >
                {'>'}
            </button>
        );
    
        // Last page button
        pageButtons.push(
            <button
                key="last"
                className={`px-1 sm:px-3 md:px-3 lg:px-3 xl:px-3 py-1 dark:text-white ${
                    currentPage === totalPages ? "cursor-not-allowed" : ""
                } rounded-md`}
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
            >
                {'>>'}
            </button>
        );
    
        return (
            <div className="flex justify-center gap-2 mt-4">
                {pageButtons}
            </div>
        );
    };
       
    const indexOfLastuser = currentPage * dataPerPage;
    const indexOfFirstuser = indexOfLastuser - dataPerPage;
    const currentusers = filteredData.slice(indexOfFirstuser, indexOfLastuser);

    return (
        <>
            <div className="w-full dark:text-white">
                <div className="flex flex-col md:flex-row justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold flex dark:text-white gap-2"> <RiUser3Line size={35}/> {t('title')}</h1>
                    <p className="dark:text-white"><span className="hover:cursor-pointer hover:text-blue-400 dark:text-white hover:underline" onClick={() => setChangeTable("dashboard")}>{t('dashboard')}</span> / {t('users')}</p>
                </div>
                
                {/* Main card  */}
                <div className="w-full h-fit mb-5 rounded-md shadow-md">

                    {/* Header */}
                    <div className="w-full h-12 bg-[#3c50e0] flex items-center rounded-t-md">
                        <h1 className="flex gap-2 p-4 items-center text">
                            <FaTable  className="text-blue-200" size={18}/><p className="text-white text-md font-semibold"></p>
                        </h1>
                    </div>
                    {/* Header end */}

                    {/* Body */}
                    <div className="w-full h-fit bg-white dark:bg-slate-800  rounded-b-md p-4">
                        <div className=" flex flex-col-reverse md:flex-row justify-between items-center w-full ">
                            <div className="flex">
                                {/* Button */}
                                <button className="bg-white dark:bg-slate-800 mb-4 border hover:bg-gray-100 dark:hover:bg-slate-400 font-bold px-3 rounded-s-md" onClick={generatePDF}>
                                    <IconContext.Provider value={{ className: "text-xl" }}>
                                        <AiOutlineFilePdf />
                                    </IconContext.Provider>
                                </button>
                                <button className="bg-white dark:bg-slate-800 mb-4 border-b border-t border-e hover:bg-gray-100 dark:hover:bg-slate-400 font-bold px-3" onClick={generateExcel}>
                                    <IconContext.Provider value={{ className: "text-xl" }}>
                                        <RiFileExcel2Line />
                                    </IconContext.Provider>
                                </button>
                                <button className="bg-white dark:bg-slate-800 mb-4 border-b border-t border-e hover:bg-gray-100 dark:hover:bg-slate-400 font-bold px-3 " onClick={() => {Router.push('register')}} >
                                    <IconContext.Provider value={{ className: "text-xl" }}>
                                        <BiPlus className="text-thin"/>
                                    </IconContext.Provider>
                                </button> 
                                {/* Button end */}

                                {/* Filter by select */}
                                <div className="mb-4 flex">
                                {
                                    userData.roles == 'sadmin' && (
                                        <>
                                            <label htmlFor="tenantfilter" className="text-sm font-medium  hidden">Tenant</label>
                                            <select id="tenantfilter" className="md:w-[150px] h-10 bg-white dark:bg-slate-800 border-b border-t border-e text-sm block w-full px-3 py-2" defaultValue={0}
                                            value={selectedTenant} onChange={handleTenantChange}
                                            >
                                                <option value="" key={0} disabled hidden>Tenant 
                                                </option>
                                                <option value="" key={0}> All Tenant </option>
                                                {
                                                    tenants.map((tenant, index) => {    
                                                        return (
                                                            <option value={tenant._id} key={index + 1}>{tenant.company}</option>
                                                        )
                                                    })
                                                }
                                            </select>  
                                        </>
                                    )
                                }
                                    <label htmlFor="rolefilter" className="text-sm font-medium  hidden">Role</label>
                                    <select id="rolefilter" className="md:w-[150px] h-10 bg-white dark:bg-slate-800 border-b border-t border-e rounded-e-md text-sm block w-full px-3 py-2" defaultValue={0}
                                    value={selectedRole} onChange={handleRoleChange}
                                    >
                                        <option value="" key={0} disabled hidden>Role 

                                        </option>
                                        <option value="" key={1}> All role </option>
                                        <option value="admin" key={2}>Admin</option>
                                        <option value="staff" key={3}>Staff</option>
                                    </select>  
                                    
                                </div>
                                {/* Filter by select end */}
                            </div>

                            {/* Search */}
                            <div className="flex gap-5">
                                <div className="relative mb-4">
                                    <input type="text" className="w-full dark:bg-slate-800 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder={t('search')} 
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    id="search"/>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </span>
                                </div>
                            </div>
                            {/* Search */}
                        </div>

                        
                        <div className="bg-white h-fit overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-md text-left uppercase bg-white dark:bg-slate-700">
                                    <tr>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">{t('name')}</th>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">Role</th>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">Email</th>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">{t('company')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800">
                                    {
                                        isLoading ? (
                                            // If loading is true, show loading indicator
                                            <tr className="text-center py-3 border dark:border-gray-500">
                                                <td colSpan={4}>
                                                    <LoadingCircle />
                                                </td>
                                            </tr>
                                        ) : currentusers.length > 0 ? (
                                            // Display filtered data if available
                                            currentusers.map((user, index) => (
                                                <tr key={index} className="hover:bg-gray-100 dark:hover:bg-slate-400 dark:odd:bg-slate-600 dark:even:bg-slate-700 hover:cursor-pointer transition-colors duration-300">
                                                    <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap underline" title="Click to edit" onClick={() => showModal("Edit", user._id)}>{user.name}</td>
                                                    <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap">{user.roles}</td>
                                                    <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap">
                                                        <a href={`mailto:${user.email}`} className="text-blue-500">{user.email}</a>
                                                    </td>
                                                    <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap">
                                                        {String(user.company_name)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            // Display message if no data found
                                            <tr className="text-center border dark:border-gray-500">
                                                <td colSpan={4} className="py-4">
                                                    {t('not-found')}
                                                </td>
                                            </tr>
                                        )
                                    }
                                </tbody>
                            </table>
                            <table className="w-full text-sm text-left hidden" ref={tableRef}>
                                <thead className="text-md text-left uppercase bg-white dark:bg-slate-700">
                                    <tr>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">{t('name')}</th>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">Role</th>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">Email</th>
                                        <th scope="col" className="px-6 border dark:border-gray-500 py-3">{t('company')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800">
                                    {filteredData.length > 0 ? (
                                        // Display filtered data if available
                                        filteredData.map((user, index) => (
                                            <tr key={index} className="hover:bg-gray-100 dark:hover:bg-slate-400 dark:odd:bg-slate-600 dark:even:bg-slate-700 hover:cursor-pointer transition-colors duration-300">
                                                <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap underline" title="Click to edit" onClick={() => showModal("Edit", user._id)}>{user.name}</td>
                                                <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap">{user.roles}</td>
                                                <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap">
                                                    <a href={`mailto:${user.email}`} className="text-blue-500">{user.email}</a>
                                                </td>
                                                <td className="px-6 border dark:border-gray-500 py-3 font-medium whitespace-nowrap">
                                                    {String(user.company_name)}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Display message if no data found
                                        <tr className="text-center border dark:border-gray-500">
                                            <td colSpan={4} className="py-4">
                                                {t('not-found')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-center sm:justify-end md:justify-end lg:justify-end xl:justify-end items-center">
                            {renderPagination()}
                        </div>
                    </div>
                    {/* Body end */}
                </div>
                {/* Main cardcend */}
            </div>

            {/* <!-- Main modal --> */}
            <div id="crud-modal" ref={addModal} className="fixed inset-0 flex hidden items-center justify-center bg-gray-500 bg-opacity-75 z-50">

                <div className="relative p-4 w-full max-w-md max-h-full ">
                    {/* <!-- Modal content --> */}
                    <div className="relative bg-white dark:bg-[#243040] rounded-[3px] shadow">
                        {/* <!-- Modal header --> */}
                        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t bg-white dark:bg-[#243040] dark:border-[#314051] text-black dark:text-white">
                            <h3 className="text-2xl font-semibold text-black dark:text-slate-200">
                                {`${modeModal} ${t('users')}`}
                            </h3>
                            <button type="button" className="text-xl bg-transparent w-8 h-8 ms-auto inline-flex justify-center items-center " data-modal-toggle="crud-modal" onClick={closeModal}>
                                <FaTimes/>
                            </button>
                        </div>
                        {/* <!-- Modal body --> */}
                        <div className="p-4 md:p-5">
                            <div className="grid gap-4 mb-4 grid-cols-2">
                                <div className="col-span-2">
                                    <label htmlFor="name" className="block mb-2 text-sm font-normal text-black dark:text-slate-200">{t('name')}</label>
                                    <input type="text" name="name" id="name" className="bg-white dark:bg-[#1d2a3a] text-black dark:text-slate-200 placeholder-[#858c96] border dark:border-[#314051] border-gray-200  text-sm rounded-[3px] focus:ring-[#3c54d9] focus:border-[#3c54d9] outline-none block w-full p-2.5 " placeholder="Type name here"
                                    readolny/>
                                </div>
                                <div className={`col-span-2 ${EditUserId == '64fa84403ce06f0129321ced' ? "hidden" : "" }`}>
                                    <label htmlFor="role" className="block mb-2 text-sm font-normal text-black dark:text-slate-200">Role</label>
                                    <select id="role" className="bg-white border dark:border-[#314051] border-gray-200 text-black dark:text-slate-200 dark:bg-[#1d2a3a] placeholder-[#858c96]  text-sm rounded-[3px] focus:ring-[#3c54d9] focus:border-[#3c54d9] outline-none block w-full p-2.5 " >
                                        <option value="admin">Admin</option>
                                        <option value="staff">Staff</option>
                                    </select>
                                </div>
                            </div>
                                <div className="flex flex-row-reverse items-center gap-3 mt-5">
                                    {
                                        EditUserId != "64fa84403ce06f0129321ced" ? (
                                            <button className="w-full bg-indigo-700 hover:bg-indigo-600 border border-indigo-800 text-white py-2 px-4 rounded text-nowrap" 
                                            onClick={() => handleDelete(EditUserId)}
                                            >
                                                {t('delete')}
                                            </button>
                                        ) : ""
                                    }
                                
                                    {
                                        modeModal === 'Edit' ? <button className="w-full bg-[#3b50df] hover:bg-blue-600 border border-indigo-700 text-white py-2 px-4 rounded text-nowrap" onClick={updateUser}>{t('save')}</button> : 
                                        <button className="bg-blue-500 hover:bg-blue-700 mt-5 text-white font-bold py-2 px-4 rounded" 
                                        // onClick={creatUser}
                                        >{t('submit')}</button>
                                    }
                                </div>
                        </div>

                    </div>
                </div>
            </div> 
        </>
    )
}
