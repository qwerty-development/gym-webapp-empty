import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FaCloudUploadAlt, FaCheckCircle, FaFile } from 'react-icons/fa'

const FileUploadDropzone = ({ onFileChange }: any) => {
	const [uploadedFile, setUploadedFile] = useState<File | undefined>()

	const onDrop = useCallback(
		(acceptedFiles: any) => {
			if (acceptedFiles && acceptedFiles.length > 0) {
				const file = acceptedFiles[0]
				setUploadedFile(file)
				onFileChange(file)
			}
		},
		[onFileChange]
	)

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		multiple: false
	})

	return (
		<div
			{...getRootProps()}
			className={`file-dropzone w-full sm:w-1/3 p-3 border-2 border-dashed rounded-xl text-center cursor-pointer transition duration-300 ${
				isDragActive
					? 'border-green-400 bg-green-100'
					: 'border-green-500 hover:border-green-400'
			}`}>
			<input {...getInputProps()} />
			{uploadedFile ? (
				<div className='text-center'>
					<FaCheckCircle className='mx-auto text-3xl text-green-500 mb-2' />
					<p className='text-sm text-green-600 mb-2'>
						Image uploaded successfully!
					</p>
					<div className='flex items-center justify-center mb-2'>
						<FaFile className='text-gray-500 mr-2' />
						<p className='text-sm text-gray-700 font-medium'>
							{uploadedFile.name}
						</p>
					</div>
					<img
						src={URL.createObjectURL(uploadedFile)}
						alt='Preview'
						className='mt-2 mx-auto h-20 w-20 object-cover rounded-full'
					/>
				</div>
			) : (
				<>
					<FaCloudUploadAlt className='mx-auto text-3xl text-green-500 mb-2' />
					{isDragActive ? (
						<p className='text-sm text-green-600'>Drop the file here...</p>
					) : (
						<p className='text-sm text-gray-400'>
							Drag & drop an image or click to select
						</p>
					)}
				</>
			)}
		</div>
	)
}

export default FileUploadDropzone
